// MIT License
//
// Copyright 2018 Electric Imp
//
// SPDX-License-Identifier: MIT
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

'use strict';

const Util = require('util');
const Readline = require('readline');
const dateformat = require('dateformat');
const ImpCentralApiHelper = require('./util/ImpCentralApiHelper');
const UserInteractor = require('./util/UserInteractor');
const ProjectConfig = require('./util/ProjectConfig');
const Identifier = require('./util/Identifier');
const Errors = require('./util/Errors');
const Utils = require('./util/Utils');
const Options = require('./util/Options');
const DeviceGroup = require('./DeviceGroup');
const Device = require('./Device');
const Colors = require('colors/safe');

// This class represents Logs impCentral API entity.
// Provides methods used by impt Logs Manipulation Commands.
class Log {
    constructor(options) {
        options = options || {};
        const accountId = options.account ? options.account : null;
        this._helper = ImpCentralApiHelper.getEntity(accountId);
        UserInteractor.setOutputFormat(options, this._helper);
        this._projectConfig = ProjectConfig.getEntity();
        this._devices = [];
        this._deviceIds = [];
        this._logStreamId = undefined;
        this._logsFinished = false;
        this._reconnecting = false;
        this._colors = {
            "status" : str => Colors.yellow(str),
            "server.log" : str => Colors.brightBlue(str),
            "agent.log" : str => Colors.cyan(str),
            "server.error" : str => Colors.bold.white(str),
            "agent.error" : str => Colors.black.bgCyan(str)
        };
        this._logDeviceIds = false;
        this._tsFormat = options.log ? options.log : Options.LOG_FULL_TS;
        this._firstLogTs = null;
        this._init();
    }

    // Initializes readline interface to handle <Ctrl-C> and <Enter> presses.
    _init() {
        this._readline = Readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this._readline.on('SIGINT', () => { process.emit('SIGINT') });

        process.on('SIGINT', () => {
            this._exitWithStatus();
        });
    }

    _closeLogStream() {
        if (this._logStreamId) {
            return this._helper.closeLogStream(this._logStreamId);
            this._logStreamId = undefined;
        }
        return Promise.resolve();
    }

    _exitWithStatus(error = null) {
        this._readline.close();
        this._closeLogStream().
            then(() => {
                if (error) {
                    UserInteractor.processError(error);
                }
                else {
                    UserInteractor.printSuccessStatus();
                }
            }).
            catch(err => {
                UserInteractor.processError(error ? error : err);
            });
    }

    // Displays historical logs for the specified Device.
    //
    // If --device option is missed but the current directory contains
    // Project File with the specified Device Group:
    // If there is only one Device assigned to this Device Group, the command is processed for it.
    // If there no or more than one Devices assigned to this Device Group,
    // the command informs a user and is not processed.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Nothing.
    get(options) {
        this._setOptions(options).then(() => {
            if (this._devices.length === 0) {
                return Promise.reject(new Errors.NoIdentifierError(Identifier.ENTITY_TYPE.TYPE_DEVICE));
            }
            else {
                const device = this._devices[0];
                if (this._devices.length > 1) {
                    return device._collectListEntities(this._devices).then(() =>
                        Promise.reject(
                            new Errors.NotUniqueIdentifierError(
                                device.entityType,
                                null,
                                this._devices.map(entity => entity.displayData))));
                }
                else {
                    // the only device found
                    return device.getEntityId().then(() => {
                        if (options.pageNumber !== undefined) {
                            return this._printDeviceLogsPage(device.id, options.pageNumber, options.pageSize).
                                then(() => this._exitWithStatus());
                        }
                        else {
                            let pageNumber = 1;
                            this._printDeviceLogs(device.id, pageNumber, options.pageSize);
                            this._readline.on('line', () => {
                                pageNumber++;
                                this._printDeviceLogs(device.id, pageNumber, options.pageSize);
                            });
                        }
                    });
                }
            }
        }).catch(error => {
            this._exitWithStatus(error);
        });
    }

    // Prints a portion of historical logs for the specified Device.
    //
    // Parameters:
    //     deviceId : string    id of the Device
    //     pageNumber : number  logs pagination page number to be printed
    //
    // Returns:                 Nothing.
    _printDeviceLogs(deviceId, pageNumber, pageSize) {
        if (this._logsFinished) {
            UserInteractor.printInfo(UserInteractor.MESSAGES.LOG_GET_FINISHED);
            this._exitWithStatus();
        }
        else {
            this._printDeviceLogsPage(deviceId, pageNumber, pageSize).then(() => {
                UserInteractor.printSuccessStatus();
                UserInteractor.printInfo('');
                UserInteractor.printInfo(UserInteractor.MESSAGES.LOG_GET_NEXT);
            }).catch(error => {
                this._exitWithStatus(error);
            });
        }
    }

    _printDeviceLogsPage(deviceId, pageNumber, pageSize) {
        return this._helper.logs(deviceId, pageNumber, pageSize).
            then(logs => {
                UserInteractor.printObject(logs.map(log => this._formatLog(log)), false);
                if (logs.length < pageSize) {
                    this._logsFinished = true;
                }
            });
    }

    // Displays logs from the specified Devices in real-time.
    //
    // --device option may be repeated several times to specify several Devices.
    // Logs from these Devices will be displayed in a one stream.
    //
    // If --dg option is specified, logs from all Devices assigned to this Device Group will be displayed.
    // --dg option may be repeated several times to specify several Device Groups.
    //
    // --device and --dg options are cumulative. Logs from all the Devices specified by these options will
    // be displayed in a one stream.
    //
    // If --device and --dg options are missed but the current directory contains Project File,
    // then all Devices assigned to Device Group specified in that Project File are assumed.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Nothing.
    stream(options) {
        this._setOptions(options).
            then(() => this._stream(this._devices)).
            catch(error => {
                this._exitWithStatus(error);
            });
    }

    _stream(devices) {
        if (devices.length === 0) {
            return Promise.reject(new Errors.NoIdentifierError(Identifier.ENTITY_TYPE.TYPE_DEVICE));
        }
        else {
            return this._helper.makeConcurrentOperations(devices, (device) => device.getEntityId()).then(() => {
                devices = Utils.getUniqueEntities(devices);
                this._deviceIds = devices.map(device => device.id);
                this._logDeviceIds = this._deviceIds.length > 1;
                return this._helper.logStream(
                    this._deviceIds,
                    this._messageHandler.bind(this),
                    this._stateChangeHandler.bind(this),
                    this._errorHandler.bind(this)).
                    then((logStreamId) => {
                        this._logStreamId = logStreamId;
                        this._reconnecting = false;
                        UserInteractor.spinnerStop();
                        UserInteractor.printInfo(
                            UserInteractor.MESSAGES.LOG_STREAM_OPENED, 
                            UserInteractor.getMultipleEntitiesInfo(devices));
                        UserInteractor.printSuccessStatus();
                        UserInteractor.printInfo('');
                        UserInteractor.printInfo(UserInteractor.MESSAGES.LOG_STREAM_EXIT);
                    });
            });
        }
    }

    // Log stream message handler
    _messageHandler(message) {
        try {
            UserInteractor.printObject(this._formatLog(JSON.parse(message), this._logDeviceIds));
        }
        catch (e) {
            this._exitWithStatus(new Errors.InternalLibraryError(
                Util.format(UserInteractor.ERRORS.LOG_STREAM_UNEXPECTED_MSG, message)));
        }
    }

    // Log stream state change handler
    _stateChangeHandler(state) {
        try {
            const json = JSON.parse(state);
            if (json.state === 'closed') {
                UserInteractor.printInfo(UserInteractor.MESSAGES.LOG_STREAM_CLOSED);
                this._exitWithStatus();
            }
        }
        catch (e) {
            this._exitWithStatus(new Errors.InternalLibraryError(
                Util.format(UserInteractor.ERRORS.LOG_STREAM_UNEXPECTED_MSG, state)));
        }
    }

    _errorHandler(error) {
        UserInteractor.printError(error);
        if (!this._reconnecting) {
            this._reconnect();
        }
    }

    _reconnect() {
        UserInteractor.printInfo(UserInteractor.MESSAGES.LOG_STREAM_RECONNECT);
        this._reconnecting = true;
        this._closeLogStream().
            then(() => this._stream(this._devices)).
            catch(error => {
                this._exitWithStatus(error);
            });
    }

    _formatLogTimestamp(ts) {
        switch (this._tsFormat) {
            case Options.LOG_NO_TS:
                return '';
            case Options.LOG_MIN_TS:
                return dateformat(new Date(ts), 'HH:MM:ss.l');
            case Options.LOG_DELTA_TS:
                if (!this._firstLogTs) {
                    this._firstLogTs = new Date(ts);
                    break;
                }
                // delta output format is (+|-)[HH:][MM:]SS.XXX
                const deltaTime = new Date(ts).getTime() - this._firstLogTs.getTime();
                const delta = new Date(Math.abs(deltaTime));
                const formats = [ '%s' ];
                const values = [ dateformat(delta, 'ss.l') ];
                if (delta.getMinutes() > 0) {
                    formats.unshift('%s:');
                    values.unshift(dateformat(delta, 'MM'));
                }
                const hours = Math.floor(delta.getTime() / 60 / 60 / 1000);
                if (hours > 0) {
                    formats.unshift('%d:');
                    values.unshift(hours);
                }
                formats.unshift(deltaTime > 0 ? '+' : '-');
                return Util.format(formats.join(''), ...values);
            case Options.LOG_EPOCH_TS:
                return new Date(ts).getTime();
        }
        return ts;
    }

    // Formats the single log message
    _formatLog(log, printDeviceId = false) {
        const ts = this._formatLogTimestamp(log.ts);
        if (UserInteractor.isOutputText()) {
            const formats = [];
            const values = [];
            // log message components:
            // optional deviceId
            if (printDeviceId && ('device_id' in log)) {
                formats.push('[%s]');
                values.push(log.device_id);
            }
            // timestamp if not empty
            if (ts) {
                formats.push('%s');
                values.push(ts);
            }
            // log type
            formats.push(UserInteractor.isOutputLevelInfoEnabled() ? this._getColor(log.type, '[%s]') : '[%s]');
            values.push(log.type);
            // log message
            formats.push('%s');
            values.push(log.msg);

            return Util.format(formats.join(' '), ...values);
        }
        else {
            log.ts = ts;
            return log;
        }
    }

    // Sets the Log specific options based on impt command options:
    // if (--device <DEVICE_IDENTIFIER>)* option is specified, the Devices identifiers
    // are initialized by its values
    // if (--dg <DEVICE_GROUP_IDENTIFIER>)* option is specified, all Devices assigned
    // to the Device Groups are used
    //
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Promise that resolves if the operation succeeded,
    //                          or rejects with an error
    _setOptions(options) {
        options = options || {};
        if (options.deviceIdentifier) {
            if (Array.isArray(options.deviceIdentifier)) {
                this._devices = this._devices.concat(options.deviceIdentifier.map(
                    device => new Device().initByIdentifier(device)));
            }
            else {
                this._devices.push(new Device().initByIdentifier(options.deviceIdentifier));
            }
        }
        if (options.deviceGroupIdentifier) {
            return this._helper.makeConcurrentOperations(
                Array.isArray(options.deviceGroupIdentifier) ? options.deviceGroupIdentifier : [options.deviceGroupIdentifier],
                (devGroup) => new DeviceGroup().initByIdentifier(devGroup).getEntity()).
                then(devGroups => this._helper.makeConcurrentOperations(devGroups,
                    (devGroup) => this._setDevicesByDeviceGroup(devGroup)));
        }
        if (!options.deviceIdentifier && !options.deviceGroupIdentifier &&
            this._projectConfig.exists()) {
            return this._projectConfig.checkConfig().
                then(() => new DeviceGroup().initByIdFromConfig(this._projectConfig.deviceGroupId, this._projectConfig.type).getEntity()).
                then((deviceGroup) => this._setDevicesByDeviceGroup(deviceGroup));
        }
        return Promise.resolve();
    }

    _setDevicesByDeviceGroup(deviceGroup) {
        return new Device().listByDeviceGroup(deviceGroup.id).
            then((devices) => {
                this._devices = this._devices.concat(devices);
                return Promise.resolve();
            });
    }

    // Formats (or doesn't format) given string with module Colors
    // based on given message type
    _getColor(type, value) {
        return this._colors.hasOwnProperty(type.toLowerCase())
               ? this._colors[type.toLowerCase()](value)
               : value;
    }
}

module.exports = Log;
