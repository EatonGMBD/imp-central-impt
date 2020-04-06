// MIT License
//
// Copyright 2020 Electric Imp
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

const Config = require('./Config');
const Errors = require('./Errors');

// impt Bitbucket Server credentials configuration representation
class BitbucketSrvConfig extends Config {

    constructor(fileName) {
        super(Config.TYPE.BITBUCKET_SRV, fileName);
        this._isCurrDir = false;
    }

    get bitbucketSrvAddr() {
        return this._json.bitbucketSrvAddr;
    }

    set bitbucketSrvAddr(bitbucketSrvAddr) {
        this._json.bitbucketSrvAddr = bitbucketSrvAddr;
    }

    get bitbucketSrvUser() {
        return this._json.bitbucketSrvUser;
    }

    set bitbucketSrvUser(bitbucketSrvUser) {
        this._json.bitbucketSrvUser = bitbucketSrvUser;
    }

    get bitbucketSrvToken() {
        return this._json.bitbucketSrvToken;
    }

    set bitbucketSrvToken(bitbucketSrvToken) {
        this._json.bitbucketSrvToken = bitbucketSrvToken;
    }

    _checkConfig() {
        if (!this._json.bitbucketSrvAddr || !this._json.bitbucketSrvUser || !this._json.bitbucketSrvToken) {
            return Promise.reject(new Errors.CorruptedConfigError(this));
        }
        return Promise.resolve();
    }
}

module.exports = BitbucketSrvConfig;
