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
const Errors = require('../../../lib/util/Errors');
const UserInteractor = require('../../../lib/util/UserInteractor');

const COMMAND = 'list';
const COMMAND_SECTION = 'build';
const COMMAND_SHORT_DESCR = 'Displays information about all or filtered builds.';
const COMMAND_DESCRIPTION = 'Displays information about all of the builds (Deployments) available to the current account.';

exports.command = COMMAND;

exports.describe = COMMAND_SHORT_DESCR;

exports.builder = function (yargs) {
    const entityType = 'Builds';
    const options = Options.getOptions({
        [Options.ACCOUNT] : false,
        [Options.OWNER] : { demandOption : false, describeFormatArgs : [ entityType ] },
        [Options.PRODUCT_IDENTIFIER] : {
            demandOption : false,
            type : 'array',
            elemType : 'string',
            describe : 'Lists builds deployed to Device Groups which belong to the specified Product(s) only.'
        },
        [Options.DEVICE_GROUP_IDENTIFIER] : {
            demandOption : false,
            type : 'array',
            elemType : 'string',
            describe : 'Lists builds deployed to the specified Device Group(s) only.'
        },
        [Options.DEVICE_GROUP_TYPE] : {
            demandOption : false,
            describe : 'Lists builds deployed to Device Groups of the specified type only.'
        },
        [Options.SHA] : {
            demandOption : false,
            type : 'array',
            elemType : 'string',
            describe : 'Lists builds with the specified SHA only.'
        },
        [Options.TAG] : {
            demandOption : false,
            describe : 'Lists builds with the specified tag only.'
        },
        [Options.FLAGGED] : {
            demandOption : false,
            describe : 'Lists builds with the "flagged" attribute set to true only.',
            nargs: 0,
            noValue: true,
            _usage: ''
        },
        [Options.UNFLAGGED] : false,
        [Options.NON_ZOMBIE] : false,
        [Options.ZOMBIE] : false,
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
    new Build(options).list(options);
};
