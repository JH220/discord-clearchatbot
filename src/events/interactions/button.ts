import { ButtonInteraction } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	async execute(interaction : ButtonInteraction, database : any) {
		const client = interaction.client as CustomClient;

		try {
			const id = interaction.customId.split(';')[0];

			if (['admin_get_user_servers', 'admin_get_user_ban', 'admin_get_user_pardon', 'admin_get_user_ban_history'].includes(id))
				await require('../../commands/utility/admin/get/user').executeButton(interaction, database);
			else if (['admin_get_server_users', 'admin_get_server_ban', 'admin_get_server_pardon', 'admin_get_server_ban_history'].includes(id))
				await require('../../commands/utility/admin/get/server').executeButton(interaction, database);
			else if (['admin_get_interaction_view_server', 'admin_get_interaction_view_user'].includes(id))
				await await require('../../commands/utility/admin/get/interaction').executeButton(interaction, database);
			else if (id == 'settings_reset')
				await require('../../commands/main/settings').executeButton(interaction, database);
			else
				client.warn(`No button interaction matching ${id} was found.`);
		}
		catch (error) {
			client.ierror(interaction, error, 'Error while executing button interaction');
			database.reply(interaction, 'ERROR_EXECUTE');
		}
	},
};