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

		if (!database.getConnection()) {
			client.error(`[Interaction ${interaction.id}] Failed to connect to the database.`);
			interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			return;
		}
		const { models } = database.getConnection();

		try {
			await database.addInteraction(interaction);
		}
		catch (error) {
			client.ierror(interaction, error, 'Error while adding interaction to the database (1)');
			try {
				await database.addInteraction(interaction);
				client.warn(`[Interaction ${interaction.id}] Interaction was added to the database after a second attempt.`);
			}
			catch (error2) {
				client.ierror(interaction, error2, 'Error while adding interaction to the database (2)');
				interaction.reply({ content: 'There was an error while executing this command!\nPlease try again later.', ephemeral: true });
				return;
			}
		}

		const bannedUser = await models.UserBan.findOne({ where: { userId: interaction.user.id, pardonModId: null } });
		if (bannedUser) return database.reply(interaction, 'COMMAND_GLOBAL_USER_BANNED', { 'REASON': bannedUser.reason, 'BAN_ID': 'BU' + bannedUser.banId });
		if (interaction.inGuild()) {
			const bannedGuild = await models.ServerBan.findOne({ where: { serverId: interaction.guildId, pardonModId: null } });
			if (bannedGuild) return database.reply(interaction, 'COMMAND_GLOBAL_GUILD_BANNED', { 'REASON': bannedGuild.reason, 'BAN_ID': 'BG' + bannedGuild.banId });
		}
		const disabledCommand = await models.DisabledCommand.findOne({ where: { commandName: interaction.commandName } });
		if (disabledCommand) return database.reply(interaction, 'COMMAND_GLOBAL_DISABLED', { 'REASON': disabledCommand.reason, 'MOD_ID': disabledCommand.modId });

		try {
			await command.execute(interaction);
		}
		catch (error) {
			client.ierror(interaction, error, 'Error while executing command');
			database.reply(interaction, 'ERROR_EXECUTE');
		}
	},
};