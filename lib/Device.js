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
const ImpCentralApi = require('imp-central-api');
const Devices = ImpCentralApi.Devices;
const ImpCentralApiHelper = require('./util/ImpCentralApiHelper');
const ListHelper = require('./util/ListHelper');
const DeleteHelper = require('./util/DeleteHelper');
const UserInteractor = require('./util/UserInteractor');
const Identifier = require('./util/Identifier');
const Entity = require('./util/Entity');
const Errors = require('./util/Errors');
const Options = require('./util/Options');
const Utils = require('./util/Utils');
const Product = require('./Product');
const DeviceGroup = require('./DeviceGroup');
const Account = require('./Account');

const ATTR_DEVICE_ONLINE = 'device_online';
const ATTR_MAC_ADDRESS = 'mac_address';
const ATTR_AGENT_ID = 'agent_id';

// This class represents Device impCentral API entity.
// Provides methods used by impt Device Manipulation Commands.
class Device extends Entity {
    // Returns online property of the Device
    get online() {
        return this.apiEntity.attributes[ATTR_DEVICE_ONLINE];
    }

    // Returns assigned property of the Device
    get assigned() {
        return this.relatedDeviceGroupId != null;
    }

    // Returns the id of associated Device Group, if exists
    get relatedDeviceGroupId() {
        if (Entity.REL_DEVICE_GROUP in this.apiEntity.relationships) {
            return this.apiEntity.relationships[Entity.REL_DEVICE_GROUP].id;
        }
        return null;
    }

    // Collects impCentral API attributes for Device update based on impt options of
    // 'device update' command and updates the specific Device.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Promise that resolves when the Device is successfully updated, 
    //                          or rejects with an error
    _update(options) {
        const attrs = {
            [Entity.ATTR_NAME] : options.name
        };
        return super._updateEntity(attrs);
    }

    // Fills DeleteHelper summary with the deleted Device info.
    // 
    // Parameters:
    //     summary : Object     DeleteHelper summary object to be filled by collected info
    //
    // Returns:                 Promise that resolves if the operation succeeded,
    //                          or rejects with an error
    _collectDeleteSummary(summary, options) {
        return this.getEntity().
            then(() => {
                summary.devices.push(this);
                if (options.force) {
                    return this._collectDeleteForceSummary(summary, options);
                }
                return Promise.resolve();
            });
    }

    // Collects a summary of all additional entities which are going to be deleted and
    // modified during "--force" delete.
    // 
    // Parameters:
    //     summary : Object     DeleteHelper summary object to be filled by collected info
    //     options : Options    impt options of the corresponding delete command
    //
    // Returns:                 Promise that resolves if the operation succeeded,
    //                          or rejects with an error
    _collectDeleteForceSummary(summary, options) {
        if (this.assigned) {
            summary.assignedDevices.push(this);
        }
        return Promise.resolve();
    }

    _collectFullInfo() {
        if (this.relatedDeviceGroupId) {
            const deviceGroup = new DeviceGroup().initById(this.relatedDeviceGroupId);
            return deviceGroup.getEntity().
                then(() => {
                    const Build = require('./Build');
                    const relations = [{
                        name : DeviceGroup.REL_CURRENT_DEPLOYMENT,
                        Entity : Build,
                        displayName : UserInteractor.MESSAGES.DG_CURRENT_DEPLOYMENT
                    }];
                    return deviceGroup._collectDisplayData(deviceGroup._getListAttrs(), relations, false);
                }).
                then(() => this._addRelatedEntity(deviceGroup));
        }
        return Promise.resolve();
    }

    _collectInfoData(full = false) {
        return super._collectInfoData(true);
    }

    // Lists Devices filtered by associated Device Group.
    //
    // Parameters:
    //     deviceGroupId: String   id of Device Group
    //
    // Returns:                    Promise that resolves when the Devices list is successfully
    //                             obtained, or rejects with an error
    listByDeviceGroup(deviceGroupId) {
        return this._list(new Options({ [Options.DEVICE_GROUP_IDENTIFIER] : [ deviceGroupId ] }));
    }

    // Lists all or filtered Devices available for a user.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Promise that resolves when the Devices list is successfully
    //                          obtained, or rejects with an error
    _list(options) {
        const filters = [];
        if (options.owner) {
            filters.push(new ListHelper.OwnerFilter(Devices.FILTER_OWNER_ID, options.owner));
        }
        if (options.productIdentifier) {
            filters.push(new ListHelper.ProductFilter(Devices.FILTER_PRODUCT_ID, options.productIdentifier));
        }
        if (options.deviceGroupIdentifier) {
            filters.push(new ListHelper.DeviceGroupFilter(Devices.FILTER_DEVICE_GROUP_ID, options.deviceGroupIdentifier));
        }
        if (options.deviceGroupType) {
            filters.push(new ListHelper.DeviceGroupTypeFilter(Devices.FILTER_DEVICE_GROUP_TYPE, options.deviceGroupType));
        }
        if (!(options.assigned && options.unassigned)) {
            if (options.assigned) {
                filters.push(new ListHelper.ArtificialFilter((entity) => Promise.resolve(Entity.REL_DEVICE_GROUP in entity.relationships)));
            }
            if (options.unassigned) {
                filters.push(new ListHelper.ArtificialFilter((entity) => Promise.resolve(!(Entity.REL_DEVICE_GROUP in entity.relationships))));
            }
        }
        if (!(options.online && options.offline)) {
            if (options.online) {
                filters.push(new ListHelper.ArtificialFilter((entity) => Promise.resolve(entity.attributes[ATTR_DEVICE_ONLINE])));
            }
            if (options.offline) {
                filters.push(new ListHelper.ArtificialFilter((entity) => Promise.resolve(!entity.attributes[ATTR_DEVICE_ONLINE])));
            }
        }

        return super._listEntities(filters);
    }

    // Reboots the Device.
    //
    // Returns:                 Promise that resolves when the Device is successfully
    //                          restarted, or rejects with an error
    _restart(options) {
        options = options || new Options();
        return this.getEntityId().
            then(() => this._helper.restart(this.id, options.conditional));
    }

    // Reboots the Devices and, optionally, starts displaying logs from them.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Nothing
    restart(options) {
        let devices = options.deviceIdentifier.map(deviceId => new Device(options).initByIdentifier(deviceId));
        this._helper.makeConcurrentOperations(devices, device => device.getEntity()).
            then(() => {
                devices = Utils.getUniqueEntities(devices);
                const unassignedDevices = devices.filter(device => !device.assigned);
                if (unassignedDevices.length > 0) {
                    return Promise.reject(new Errors.ImptError(
                        UserInteractor.ERRORS.UNASSIGNED_DEVICES_RESTART,
                        UserInteractor.getMultipleEntitiesInfo(unassignedDevices)));
                }
                return this._helper.makeConcurrentOperations(devices, device => device._restart(options));
            }).
            then(() => {
                UserInteractor.printInfo(
                    options.conditional ? UserInteractor.MESSAGES.DEVICE_COND_RESTARTED : UserInteractor.MESSAGES.DEVICE_RESTARTED,
                    UserInteractor.getMultipleEntitiesInfo(devices));
                if (options.log) {
                    const Log = require('./Log');
                    new Log(options)._stream(devices);
                }
                else {
                    UserInteractor.printResultWithStatus();
                }
            }).
            catch(error => UserInteractor.processError(error));
    }

    assignToDG(deviceGroup, devices) {
        return this._helper.assignDevices(deviceGroup.id, ...devices.map(device => device.id)).
            then(() => UserInteractor.printInfo(UserInteractor.MESSAGES.DEVICE_ASSIGNED_TO_DG,
                UserInteractor.getMultipleEntitiesInfo(devices), deviceGroup.identifierInfo))
            .catch(error => UserInteractor.processError(error));
    }

    // Assigns the Device to a Device Group specified by the options or reports an error occurred.
    // User is asked to confirm the operation if the specified Device is already assigned to
    // another Device Group.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Nothing
    assign(options) {
        const deviceGroup = new DeviceGroup(options);
        let devices = options.deviceIdentifier.map(deviceId => new Device().initByIdentifier(deviceId));
        this._helper.makeConcurrentOperations(devices, device => device.getEntity()).
            then(() => deviceGroup.getEntity()).
            then(() => {
                devices = Utils.getUniqueEntities(devices);
                if (devices.every(device => device.relatedDeviceGroupId === deviceGroup.id)) {
                    UserInteractor.printInfo(
                        UserInteractor.MESSAGES.DEVICE_ALREADY_ASSIGNED_TO_DG,
                        UserInteractor.getMultipleEntitiesInfo(devices),
                        deviceGroup.identifierInfo);
                }
                else {
                    devices = devices.filter(device => device.relatedDeviceGroupId !== deviceGroup.id);
                    const reassignedDevices = devices.filter(device => device.assigned);
                    return UserInteractor.processCancelContinueChoice(
                        Util.format(UserInteractor.MESSAGES.DEVICE_REASSIGN, 
                            UserInteractor.getMultipleEntitiesInfo(reassignedDevices), deviceGroup.identifierInfo),
                        this.assignToDG.bind(this),
                        [deviceGroup, devices],
                        options.confirmed || reassignedDevices.length === 0);
                }
            }).
            then(() => UserInteractor.printResultWithStatus()).
            catch(error => UserInteractor.processError(error));
    }

    // Unassigns the specified Device. Does nothing if the Device already unassigned.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Promise that resolves when the Device(s) are successfully
    //                          unassigned, or rejects with an error
    _unassign(devices, options, errorHandler = null) {
        return this._helper.makeConcurrentOperations(devices, device => device.getEntity()).
            then(() => {
                devices = Utils.getUniqueEntities(devices);
                const deviceGroupsDevices = {};
                for (let device of devices) {
                    const deviceGroupId = device.relatedDeviceGroupId ? device.relatedDeviceGroupId : '';
                    if (deviceGroupsDevices[deviceGroupId] === undefined) {
                        deviceGroupsDevices[deviceGroupId] = [];
                    }
                    deviceGroupsDevices[deviceGroupId].push(device);
                }
                return this._helper.makeConcurrentOperations(Object.keys(deviceGroupsDevices),
                    (deviceGroupId) => {
                        const dgDevices = deviceGroupsDevices[deviceGroupId];
                        if (deviceGroupId) {
                            return this._helper.unassignDevices(deviceGroupId, options.unbond, ...dgDevices.map(device => device.id)).
                                then(() => UserInteractor.printInfo(
                                    UserInteractor.MESSAGES.DEVICE_UNASSIGNED,
                                    UserInteractor.getMultipleEntitiesInfo(dgDevices))).
                                catch(error => {
                                    if (errorHandler) {
                                        errorHandler(error, dgDevices);
                                    } else {
                                        throw error;
                                    }
                                });
                        } else {
                            UserInteractor.printInfo(
                                UserInteractor.MESSAGES.DEVICE_ALREADY_UNASSIGNED,
                                UserInteractor.getMultipleEntitiesInfo(dgDevices));
                            return Promise.resolve();
                        }
                    });
            });
    }

    // Unassigns the specified Device. Does nothing if the Device already unassigned.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Nothing
    unassign(options) {
        const devices = options.deviceIdentifier.map(deviceId => new Device().initByIdentifier(deviceId));
        this._unassign(devices, options).
            then(() => UserInteractor.printResultWithStatus()).
            catch(error => UserInteractor.processError(error));
    }

    // Removes the specified Devices from the current account.
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Nothing
    remove(options) {
        let devices = options.deviceIdentifier.map(deviceId => new Device().initByIdentifier(deviceId));
        this._helper.makeConcurrentOperations(devices, device => device.getEntity()).
            then(() => {
                devices = Utils.getUniqueEntities(devices);
                return new DeleteHelper().processDeleteEntities(devices, options);
            }).
            then(() => UserInteractor.printResultWithStatus()).
            catch(error => UserInteractor.processError(error));
    }

    // Returns related entities that will be displayed for every Device
    // by 'device info' command
    _getInfoRelationships() {
        return [
            { name : Entity.REL_DEVICE_GROUP, Entity : DeviceGroup },
            { name : Entity.REL_PRODUCT, Entity : Product }
        ].concat(super._getInfoRelationships());
    }

    // Returns related entities that will be displayed for every Entity
    // by 'device list' command.
    _getListRelationships() {
        return [
            { name : Entity.REL_DEVICE_GROUP, Entity : DeviceGroup },
            { name : Entity.REL_OWNER, Entity : Account, displayName : UserInteractor.MESSAGES.ENTITY_OWNER, skipMine : true }
        ];
    }

    // Returns array of attributes that will be displayed for every Device
    // by 'device list' command
    _getListAttrs() {
        return [Entity.ATTR_NAME, ATTR_MAC_ADDRESS, ATTR_AGENT_ID, ATTR_DEVICE_ONLINE];
    }

    // Initializes the Device entity
    _init() {
        this._Entity = Device;
        this._identifier.init(Identifier.ENTITY_TYPE.TYPE_DEVICE, [ATTR_MAC_ADDRESS, ATTR_AGENT_ID, Entity.ATTR_NAME]);
    }

    // Sets the Device specific options based on impt command options:
    // if --device <DEVICE_IDENTIFIER> option is specified, the Device identifier 
    // is initialized by its value
    //
    // Parameters:
    //     options : Options    impt options of the corresponding command
    //
    // Returns:                 Promise that resolves if the operation succeeded,
    //                          or rejects with an error
    _setOptions(options) {
        options = options || {};
        if (options.deviceIdentifier) {
            this.initByIdentifier(options.deviceIdentifier);
        }
        return Promise.resolve();
    }
}

module.exports = Device;
