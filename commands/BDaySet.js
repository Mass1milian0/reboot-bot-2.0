const { SlashCommandBuilder } = require('discord.js');
const sqlite3 = require('sqlite3')
//initialize a new db or open database
const db = new sqlite3.Database('./bdays.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the bdays database.');
});
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbirthday')
        .setDescription('Set your birthday')
        .addStringOption(option => option.setName('date').setDescription('Your birthday in the format DD/MM/YYYY').setRequired(true)),
    async execute(interaction) {
        let date = interaction.options.getString('date');
        let user = interaction.user.id;
        db.run(`INSERT INTO bdays VALUES(?, ?)`, [user, date], function (err) {
            if (err) {
                return console.log(err.message);
            }
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        });
        await interaction.reply({content: `Your birthday has been set to ${date}`, ephemeral: true});
    }
};