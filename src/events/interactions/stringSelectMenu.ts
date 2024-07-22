import { StringSelectMenuInteraction } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	async execute(interaction : StringSelectMenuInteraction, database : any) {
		const client = interaction.client as CustomClient;

		try {
			const id = interaction.customId.split(';')[0];

			if (id == 'settings_select')
				await require('../../commands/main/settings').executeStringSelectMenu(interaction, database);
			else
				client.warn(`No string select menu interaction matching ${id} was found.`);
		}
		catch (error) {
			client.ierror(interaction, error, 'Error while executing button interaction');
			database.reply(interaction, 'ERROR_EXECUTE');
		}
	},
};