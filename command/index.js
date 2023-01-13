const translateCmd = require("./translate");
module.exports = {
    registerCommand: (program, config) => {
        let app = program
            .command(config.name)
            .description(config.description)

        config.options.forEach( option => {
            app.option(option.flags, option.description, option.defaultValue)
        })

            app.action(config.action);
    }
}
