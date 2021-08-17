console.log("Starting bot...");
const start = new Date().getMilliseconds();

const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('../config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if(!command) return;

    if(command.permissions) {
        if(message.channel.type != 'text') return message.reply("this command can not be executed in DM's.");
        const authorPerms = message.channel.permissionsFor(message.member);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return message.reply("you do not have enough permissions to run this command.");
        }
    }

    try {
		command.execute(message, args);
	} catch (error) {
        console.error(error);
		message.reply(`there was an error trying to execute that command!
Please report it at https://github.com/jh220/discord-clearchatbot/issues :heart:`);
	}
});

client.once('ready', () => {
    const time = new Date().getMilliseconds();
    console.log(`Bot started! Startup process took ${time}ms.`);
});
client.once('disconnect', () => console.log("Bot stopped!"));

client.login(token);