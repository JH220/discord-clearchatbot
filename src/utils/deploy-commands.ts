import { REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
const { clientId, token, adminServerId } = require('../../config.json');

const commands : JSON[] = [];
const foldersPath = join(__dirname, '../commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			if (command.data.name == 'admin') continue;
			commands.push(command.data.toJSON());
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		console.log(`Refreshing ${commands.length} application (/) commands...`);

		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		) as any[];

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);

		console.log('Registering admin command...');

		await rest.put(
			Routes.applicationGuildCommands(clientId, adminServerId),
			{ body: [require('../commands/utility/admin').data.toJSON()] },
		) as any[];

		console.log('Successfully registered admin command.');
	}
	catch (error) {
		console.error(error);
	}
})();
