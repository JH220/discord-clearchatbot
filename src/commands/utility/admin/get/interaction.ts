import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Interaction } from 'discord.js';
import { Sequelize } from 'sequelize';
import { CustomClient } from '../../../../bot';

const adminGetUser = require('./user');
const adminGetServer = require('./server');

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any, entry : any) {
		await interaction.reply(await getReply(interaction, entry, database) as any);
		await database.reply(interaction, 'COMMAND_ADMIN_GET_INTERACTION_SUCCESS', {}, false);
	},
	async executeButton(interaction : ButtonInteraction, database : any) {
		switch (interaction.customId.split(';')[0]) {
		case 'admin_get_interaction_view_server': {
			const serverId = interaction.customId.split(';')[1];
			if (!serverId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_INTERACTION_VIEW_SERVER_ERROR', {}, false);

			const models = (database.connection as Sequelize).models;
			const server : any = await models.Server.findOne({ where: { serverId: serverId } });
			if (!server) {
				await (interaction.client as CustomClient).warn(`[Interaction ${interaction.id}] Server ID ${serverId} not found in database.`);
				return await database.reply(interaction, 'INTERACTION_ADMIN_GET_INTERACTION_VIEW_SERVER_ERROR_SERVER_NOT_FOUND', {}, false);
			}

			await interaction.reply(await adminGetServer.getReply(interaction, server, database) as any);
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_INTERACTION_VIEW_SERVER_SUCCESS', {}, false);
			break;
		}
		case 'admin_get_interaction_view_user': {
			const userId = interaction.customId.split(';')[1];
			if (!userId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_INTERACTION_VIEW_USER_ERROR', {}, false);

			const models = (database.connection as Sequelize).models;
			const user : any = await models.User.findOne({ where: { userId: userId } });
			if (!user) {
				await (interaction.client as CustomClient).warn(`[Interaction ${interaction.id}] User ID ${userId} not found in database.`);
				return await database.reply(interaction, 'INTERACTION_ADMIN_GET_INTERACTION_VIEW_USER_ERROR_USER_NOT_FOUND', {}, false);
			}

			await interaction.reply(await adminGetUser.getReply(interaction, user, database) as any);
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_INTERACTION_VIEW_USER_SUCCESS', {}, false);
			break;
		}
		}
	},
};

async function getReply(interaction : Interaction, entry: any, database : any) : Promise<{ embeds: [EmbedBuilder], components: [ActionRowBuilder] }> {
	const models = (database.connection as Sequelize).models;
	const server : any = await models.Server.findOne({ where: { serverId: entry.serverId } });
	const user : any = await models.User.findOne({ where: { userId: entry.userId } });
	const args = JSON.parse(entry.args) ?? {};

	// Manually adding interaction args to the response
	args['INTERACTION_ID'] = entry.interactionId;
	args['CHANNEL_ID'] = entry.channelId;
	args['CHANNEL_NAME'] = entry.channelName ?? 'N/A';
	args['USER_ID'] = entry.userId;
	args['USER_NAME'] = user?.userName ? '@' + user?.userName : 'N/A';
	args['USER'] = `<@${entry.userId}>`;
	args['SHARD_ID'] = server?.shardId ?? 'N/A';
	args['GUILD_ID'] = args['SERVER_ID'] = entry.serverId;
	args['SERVER_NAME'] = server?.serverName ?? 'N/A';
	args['COMMAND_NAME'] = entry.command.split(' ')[0].substring(1);
	args['COMMAND_ID'] = 'N/A';

	var message : string = await database.getMessage(entry.result, null, args) ?? 'N/A';

	const lines = message.split('\n');
	message = lines[0].substring(0, 50);
	if (lines.length > 1) message += ' ...';
	else if (lines[0].length > 50) message += ' ...';

	const embed = new EmbedBuilder()
		.setColor('#00FFFF')
		.setTitle(await database.getMessage('INTERACTION_ADMIN_GET_INTERACTION_EMBED_TITLE', interaction) ?? 'INTERACTION_ADMIN_GET_INTERACTION_EMBED_TITLE')
		.setDescription(await database.getMessage('INTERACTION_ADMIN_GET_INTERACTION_EMBED', interaction) ?? 'INTERACTION_ADMIN_GET_INTERACTION_EMBED')
		.addFields(
			{ name: 'Interaction ID', value: entry.interactionId, inline: true },
			{ name: 'Shard ID', value: (server?.shardId as number)?.toString() ?? 'N/A', inline: true },
			{ name: 'Server', value: `"${server?.serverName ?? 'N/A'}" (${entry.serverId})`, inline: false },
			{ name: 'Channel', value: `#${entry.channelName ?? 'N/A'} (${entry.channelId})`, inline: true },
			{ name: 'User', value: `"@${user?.userName ?? 'N/A'}" (<@${entry.userId}>)`, inline: true },
			{ name: 'Command', value: entry.command, inline: false },
			{ name: 'Result', value: entry.result, inline: false },
			{ name: 'Response', value: '\n\n' + (message ?? 'N/A'), inline: false },
		);


	const viewServerButton = new ButtonBuilder()
		.setCustomId(`admin_get_interaction_view_server;${entry.serverId}`)
		.setLabel('View Server')
		.setStyle(ButtonStyle.Primary);
	const viewUserButton = new ButtonBuilder()
		.setCustomId(`admin_get_interaction_view_user;${entry.userId}`)
		.setLabel('View User')
		.setStyle(ButtonStyle.Primary);

	const row = new ActionRowBuilder().addComponents(
		viewServerButton,
		viewUserButton,
		await adminGetUser.getBanButton(interaction, entry.userId, database),
	);

	return { embeds: [embed], components: [row] };
}