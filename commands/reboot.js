const { SlashCommandBuilder } = require('discord.js');
const ampWrapper = require('./ampwrapper.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('reboot')
        .setDescription('reboots a server'),
    async execute(interaction) {
        let servers = await ampWrapper.getInstances()
        //now we have to parse server data to actually template it into a menu, however we can't do it yet because api is down and we can't test it
        await interaction.reply({content: `Your birthday has been set to ${date}`, ephemeral: true});
    }
};