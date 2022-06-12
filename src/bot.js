const fs = require('node:fs');
const { Client, Intents, Collection } = require('discord.js');
const { token } = require('../config.json');

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Reading event files
const eventFiles = fs.readdirSync('./src/events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) client.once(event.name, (...args) => event.execute(...args));
	else client.on(event.name, (...args) => event.execute(...args));
}

// Reading command files
client.commands = new Collection();
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Reading button files
const buttons = new Collection();
const buttonFiles = fs.readdirSync('./src/buttons').filter(file => file.endsWith('.js'));
for (const file of buttonFiles) {
	const button = require(`./buttons/${file}`);
	buttons.set(button.id, button);
}
// Reading select menu files
const selectMenus = new Collection();
const selectMenuFiles = fs.readdirSync('./src/selectMenus').filter(file => file.endsWith('.js'));
for (const file of selectMenuFiles) {
	const selectMenu = require(`./selectMenus/${file}`);
	selectMenus.set(selectMenu.id, selectMenu);
}
// Reading context menu files
const contextMenus = new Collection();
const contextMenuFiles = fs.readdirSync('./src/contextMenus').filter(file => file.endsWith('.js'));
for (const file of contextMenuFiles) {
	const contextMenu = require(`./contextMenus/${file}`);
	contextMenus.set(contextMenu.id, contextMenu);
}

// Runs when an interaction is created
client.on('interactionCreate', async interaction => {
	// Returns if bot is not ready
	if (!(new (require('./database'))().getConnection())) return;

	// Import mysql database
	const database = new (require('./database'))();
	const { models } = database.getConnection();

	// Add interaction to database
	database.addInteraction(interaction);

	// Lookup if user or guild banned
	const bannedUser = await models.UserBan.findOne({ where: { userId: interaction.user.id, pardonModId: null } });
	if (bannedUser) return database.reply(interaction, 'USER_BANNED', { 'REASON': bannedUser.reason, 'BAN_ID': bannedUser.banId });
	if (interaction.inGuild()) {
		const bannedGuild = await models.GuildBan.findOne({ where: { guildId: interaction.guildId, pardonModId: null } });
		if (bannedGuild) return database.reply(interaction, 'GUILD_BANNED', { 'REASON': bannedUser.reason, 'BAN_ID': bannedGuild.banId });
	}

	if (interaction.isCommand()) {
		// Get the command name of the interaction
		const { commandName } = interaction;
		// Returns if command does not exists
		if (!interaction.client.commands.has(commandName)) return;

		// Defer reply to prevent timeout errors
		await interaction.deferReply({ ephemeral: true });

		// Lookup if command is disabled by an admin
		const disabledCommand = await models.DisabledCommands.findOne({ where: { commandName: commandName } });
		if (disabledCommand) return database.reply(interaction, 'COMMAND_DISABLED', { 'REASON': disabledCommand.reason });

		try {
			// Execute the individual command file
			client.commands.get(commandName).execute(interaction);
		}
		catch (error) {
			// Prints the error to the console
			console.error(`Error at ${interaction.id}:\n${error.stack}`);
			// Update the result with the interaction database entry
			database.reply(interaction, 'ERROR', { 'STACK': error.stack });
		}
	}
	else if (interaction.isButton()) {
		// Get the custom id of the button interaction
		const customId = interaction.customId.split(',')[0];
		// Returns if button does not exits
		if (!buttons.has(customId)) return;

		// Lookup if button is disabled by an admin
		const disabledCommand = await models.DisabledCommands.findOne({ where: { commandName: buttons.get(customId).linkedCommand } });
		if (disabledCommand) return database.reply(interaction, 'COMMAND_DISABLED', { 'REASON': disabledCommand.reason });

		try {
			// Execute the individual button interaction
			buttons.get(customId).execute(interaction);
		}
		catch (error) {
			// Prints the error to the console
			console.error(`Error at ${interaction.id}:\n${error.stack}`);
			// Update the result with the interaction database entry
			database.reply(interaction, 'ERROR', { 'STACK': error.stack });
		}
	}
	else if (interaction.isSelectMenu()) {
		// Get the custom id of the select menu interaction
		const customId = interaction.customId.split(',')[0];
		// Returns if select menu does not exits
		if (!selectMenus.has(customId)) return;

		// Lookup if select menu is disabled by an admin
		const disabledCommand = await models.DisabledCommands.findOne({ where: { commandName: selectMenus.get(customId).linkedCommand } });
		if (disabledCommand) return database.reply(interaction, 'COMMAND_DISABLED', { 'REASON': disabledCommand.reason });

		try {
			// Execute the individual select menu interaction
			selectMenus.get(customId).execute(interaction);
		}
		catch (error) {
			// Prints the error to the console
			console.error(`Error at ${interaction.id}:\n${error.stack}`);
			// Update the result with the interaction database entry
			database.reply(interaction, 'ERROR', { 'STACK': error.stack });
		}
	}
	else if (interaction.isContextMenu()) {
		// Get the custom id of the context menu interaction
		const customId = interaction.customId.split(',')[0];
		// Returns if context menu does not exits
		if (!contextMenus.has(customId)) return;

		// Lookup if context menu is disabled by an admin
		const disabledCommand = await models.DisabledCommands.findOne({ where: { commandName: contextMenus.get(customId).linkedCommand } });
		if (disabledCommand) return database.reply(interaction, 'COMMAND_DISABLED', { 'REASON': disabledCommand.reason });

		try {
			// Execute the individual context menu interaction
			contextMenus.get(customId).execute(interaction);
		}
		catch (error) {
			// Prints the error to the console
			console.error(`Error at ${interaction.id}:\n${error.stack}`);
			// Update the result with the interaction database entry
			database.reply(interaction, 'ERROR', { 'STACK': error.stack });
		}
	}
});

// Login to Discord with the bot's token
client.login(token);