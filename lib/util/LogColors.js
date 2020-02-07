'use strict';

const Colors = require('colors/safe');

class LogColors {

  constructor() {
      this._colors = {
          "status" : str => Colors.yellow(str)
        , "server.log" : str => Colors.brightBlue(str)
        , "agent.log" : str => Colors.cyan(str)
        , "server.error" : str => Colors.bold.white(str)
        , "agent.error" : str => Colors.black.bgCyan(str)
      };
  }

  getColor(type, value)
  {
    return   this._colors.hasOwnProperty(type.toLowerCase())
           ? this._colors[type.toLowerCase()](value)
           : value;
  }

};

module.exports = LogColors;
