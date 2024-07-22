import { ChatInputCommandInteraction } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any) {
		const client = interaction.client as CustomClient;
		const command = client.commands.get(interaction.commandName);

		if (!command) {
			client.warn(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		}
		catch (error) {
			client.ierror(interaction, error, 'Error while executing command');
			database.reply(interaction, 'ERROR_EXECUTE');
		}
	},
};