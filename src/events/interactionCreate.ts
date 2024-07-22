import { ButtonInteraction, ChatInputCommandInteraction, Events, Interaction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { CustomClient } from '../bot';

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction : Interaction) {
		const database = new (require('../utils/database'))();
		const client = interaction.client as CustomClient;

		if (!database.getConnection()) {
			client.error(`[Interaction ${interaction.id}] Failed to connect to the database.`);
			await replyError(interaction, database, 'ERROR_EXECUTE_DATABASE_NO_CONNECTION');
			return;
		}

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
				await replyError(interaction, database, 'ERROR_EXECUTE');
				return;
			}
		}

		const { models } = database.getConnection();
		const command = (interaction as any).commandName ?? (interaction as any).customId?.split(';')[0];

		const bannedUser = await models.UserBan.findOne({ where: { userId: interaction.user.id, pardonModId: null } });
		if (bannedUser) return database.reply(interaction, 'COMMAND_GLOBAL_USER_BANNED', { 'REASON': bannedUser.reason, 'BAN_ID': 'BU' + bannedUser.banId });
		if (interaction.inGuild()) {
			const bannedGuild = await models.ServerBan.findOne({ where: { serverId: interaction.guildId, pardonModId: null } });
			if (bannedGuild) return database.reply(interaction, 'COMMAND_GLOBAL_GUILD_BANNED', { 'REASON': bannedGuild.reason, 'BAN_ID': 'BG' + bannedGuild.banId });
		}
		const disabledCommand = await models.DisabledCommand.findOne({ where: { commandName: command } });
		if (disabledCommand) return database.reply(interaction, 'COMMAND_GLOBAL_DISABLED', { 'REASON': disabledCommand.reason, 'MOD_ID': disabledCommand.modId });


		if (interaction.isChatInputCommand()) require('./interactions/chatInputCommand').execute(interaction as ChatInputCommandInteraction, database);
		if (interaction.isButton()) require('./interactions/button').execute(interaction as ButtonInteraction, database);
		if (interaction.isModalSubmit()) require('./interactions/modalSubmit').execute(interaction as ModalSubmitInteraction, database);
		if (interaction.isStringSelectMenu()) require('./interactions/stringSelectMenu').execute(interaction as StringSelectMenuInteraction, database);
	},
};

async function replyError(interaction : Interaction, database : any, key : string) {
	var message : string = await database.getMessage(key, interaction);

	if (!message) {
		this.logger.warn(`[Interaction ${interaction.id}] Message ${key} not found in messages.json.`);
		message = key;
	}

	try {
		(interaction as any).reply({ content: message, ephemeral: true });
	}
	catch {
		(interaction.client as CustomClient).warn(`[Interaction ${interaction.id}] Failed to reply with error message.`);
	}
}