// MIT License
//
// Copyright 2019 Electric Imp
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

const Auth = require('../../../lib/Auth');
const Options = require('../../../lib/util/Options');
const Errors = require('../../../lib/util/Errors');
const UserInteractor = require('../../../lib/util/UserInteractor');

const COMMAND = 'bitbucket-server';
const COMMAND_SECTION = 'auth';
const COMMAND_SHORT_DESCR = 'Adds Bitbucket Server address and credentials to auth file.';
const COMMAND_DESCRIPTION = COMMAND_SHORT_DESCR;

exports.command = COMMAND;

exports.describe = COMMAND_SHORT_DESCR;

exports.builder = function (yargs) {
    const options = Options.getOptions({
        [Options.LOCAL] : false,
        [Options.BITBUCKET_SERVER_ADDRESS] : {
            demandOption : false,
            describe : 'A Bitbucket Server address. E.g., "https://bitbucket-srv.itd.example.com"',
            _usage: '<bitbucket_server_address>'
        },
        [Options.USER] : {
            demandOption : false,
            describe : 'A Bitbucket Server account username.',
            _usage: '<bitbucket_server_username>'
        },
        [Options.PASSWORD] : {
            demandOption : false,
            describe : 'A Bitbucket Server account password or personal access token.',
            _usage: '<bitbucket_server_password>'
        },
        [Options.OUTPUT] : false
    });
    return yargs
        .usage(Options.getUsage(COMMAND_SECTION, COMMAND, COMMAND_DESCRIPTION, Options.getCommandOptions(options)))
        .options(options)
        .check(function (argv) {
            const opts = new Options(argv);
            if (opts.user === undefined && opts.password) {
                return new Errors.CommandSyntaxError(UserInteractor.ERRORS.CMD_COOPERATIVE_OPTIONS, Options.PASSWORD, Options.USER);
            }
            return Options.checkOptions(argv, options);
        })
        .strict();
};

exports.handler = function (argv) {
    const options = new Options(argv);
    new Auth(options).bitbucketSrv(options);
};
