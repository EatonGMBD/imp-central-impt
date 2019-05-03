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

const Build = require('../../../lib/Build');
const Options = require('../../../lib/util/Options');

const COMMAND = 'copy';
const COMMAND_SECTION = 'build';
const COMMAND_SHORT_DESCR = 'Copies the specified build to the specified Device Group.';
const COMMAND_DESCRIPTION = 'Copies the specified build (Deployment) to a new Deployment related to the specified Device Group.' +
    ' Fails if the specified Deployment or the specified Device Group does not exist.';

exports.command = COMMAND;

exports.describe = COMMAND_SHORT_DESCR;

exports.builder = function (yargs) {
    const options = Options.getOptions({
        [Options.ACCOUNT] : false,
        [Options.BUILD_IDENTIFIER] :  {
            demandOption : false,
            describe : 'The Build identifier of the Deployment to be copied.' +
                ' If not specified, the most recent Deployment for the Device Group referenced by the Project file' +
                ' in the current directory is used (if there is no Project file, the command fails).'
        },
        [Options.DEVICE_GROUP_IDENTIFIER] : {
            demandOption : true,
            describe : 'The Device Group identifier of the Device Group the new Deployment is created for.'
        },
        [Options.ALL] : {
            demandOption : false,
            describe : 'Copy all attributes of the specified Deployment.'
        },
        [Options.OUTPUT] : false
    });
    return yargs
        .usage(Options.getUsage(COMMAND_SECTION, COMMAND, COMMAND_DESCRIPTION, Options.getCommandOptions(options)))
        .options(options)
        .check(function (argv) {
            return Options.checkOptions(argv, options);
        })
        .strict();
};

exports.handler = function (argv) {
    const options = new Options(argv);
    new Build(options).copy(options);
};
