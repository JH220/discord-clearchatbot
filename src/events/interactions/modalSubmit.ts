import { ModalSubmitInteraction } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	async execute(interaction : ModalSubmitInteraction, database : any) {
		const client = interaction.client as CustomClient;

		try {
			const id = interaction.customId.split(';')[0];

			if (['admin_get_user_ban_confirm', 'admin_get_user_pardon_confirm'].includes(id))
				await require('../../commands/utility/admin/get/user').executeModal(interaction, database);
			else if (['admin_get_server_ban_confirm', 'admin_get_server_pardon_confirm'].includes(id))
				await require('../../commands/utility/admin/get/server').executeModal(interaction, database);
			else
				client.warn(`No modal interaction matching ${id} was found.`);
		}
		catch (error) {
			client.ierror(interaction, error, 'Error while executing button interaction');
			database.reply(interaction, 'ERROR_EXECUTE');
		}
	},
};