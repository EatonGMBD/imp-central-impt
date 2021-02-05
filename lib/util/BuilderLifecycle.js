const Shell = require('shelljs');
const UserInteractor = require('./UserInteractor');

function executeCommands(label, commands, commandVariables = {}) {
    if (!commands || commands.length == 0) {
        return;
    }

    for (var command of commands) {
        const finalCommand = Object.keys(commandVariables).reduce((str, variable) => {
            return str.replace(new RegExp(`\\\${${variable}}`, RegExp.global), commandVariables[variable]);
        }, command);
        if (Shell.exec(finalCommand).code !== 0) {
            UserInteractor.processError({message: `${label} lifecycle command failure (${command}).`})
        }
    }
}

const BuilderLifecycle = {
    executeCommands,
};

module.exports = BuilderLifecycle;