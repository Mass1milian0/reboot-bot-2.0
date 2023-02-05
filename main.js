const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require("./commandRegister.js")
const sqlite3 = require('sqlite3')
//initialize a new db or open database
const db = new sqlite3.Database('./bdays.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the bdays database.');
});
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

/**
 * this function runs everyday at 00:00:00 separately from the whole algorithm to check if it's someone's birthday from the database
 * if it is, it sends a message to the birthday person
 */
function bDayChecker(){
    let today = new Date();
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let date = day + "/" + month + "/" + year;
    db.all(`SELECT * FROM bdays` /*WHERE date = ?`, [date], */,(err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            client.users.fetch(row.user).then(user => {
                user.send("Happy birthday!");
            });
        });
    });
}


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

//runs the bDayChecker function every day at 00:00:00 separately from the whole algorithm
setInterval(bDayChecker, 86400000);

client.login(process.env.TOKEN);