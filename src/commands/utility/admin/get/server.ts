import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Interaction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Sequelize } from 'sequelize';

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any, server : any) {
		await interaction.reply(await getReply(interaction, server, database) as any);
		await database.reply(interaction, 'COMMAND_ADMIN_GET_SERVER_SUCCESS', {}, false);
	},
	async executeButton(interaction : ButtonInteraction, database : any) {
		switch (interaction.customId.split(';')[0]) {
		case 'admin_get_server_users': {
			await interaction.reply(interaction.customId);
			break;
		}
		case 'admin_get_server_ban': {
			const serverId = interaction.customId.split(';')[1];
			if (!serverId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_BAN_ERROR', {}, false);

			const modal = new ModalBuilder().setCustomId(`admin_get_server_ban_confirm;${serverId}`).setTitle('Server Ban Confirmation 📜');
			const banReason = new TextInputBuilder()
				.setCustomId('admin_get_server_ban_confirm_reason')
				.setLabel('Please provide a reason for the ban.')
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			modal.addComponents(new ActionRowBuilder().addComponents(banReason) as any);
			await interaction.showModal(modal);
			break;
		}
		case 'admin_get_server_pardon': {
			const banId = interaction.customId.split(';')[1];
			if (!banId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_PARDON_ERROR', {}, false);

			const modal = new ModalBuilder().setCustomId(`admin_get_server_pardon_confirm;${banId}`).setTitle('Server Pardon Confirmation 📜');
			const pardonReason = new TextInputBuilder()
				.setCustomId('admin_get_server_pardon_confirm_reason')
				.setLabel('Please provide a reason for the pardon.')
				.setStyle(TextInputStyle.Short)
				.setRequired(false);

			modal.addComponents(new ActionRowBuilder().addComponents(pardonReason) as any);
			await interaction.showModal(modal);
			break;
		}
		case 'admin_get_server_ban_history': {
			const serverId = interaction.customId.split(';')[1];
			if (!serverId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_BAN_HISTORY_ERROR', {}, false);
			var description = '**Server ID**: ' + serverId + '\n\n**Ban History**:\n';
			const models = (database.connection as Sequelize).models;
			var bans = await models.ServerBan.findAll({ where: { serverId: serverId } });

			// only show the last 5 bans
			if (bans.length > 5) {
				bans = bans.slice(bans.length - 5);
				description += 'Only showing the last 5 bans.\n';
			}
			else if (bans.length == 0)
				description += '\nNo ban history found for this server.';

			for (let i = 0; i < bans.length; i++) {
				const ban = bans[i] as any;
				const mod : any = ban.modId ? await models.User.findOne({ where: { userId: ban.modId } }) : null;
				const pardonMod : any = ban.pardonModId ? await models.User.findOne({ where: { userId: ban.pardonModId } }) : null;

				description += `\n
				**Ban ID**: **__BU${ban.banId}__**
				**Ban Reason**: ${ban.reason ?? 'N/A'}
				**Ban Date**: <t:${Math.floor(ban.createdAt.getTime() / 1000)}:R>
				**Ban Mod**: ${mod ? `<@${mod.userId}> (@${mod.userName})` : 'N/A'}
				${ban.pardonModId ? `**Pardon Reason**: ${ban.pardonReason ?? 'N/A'}
				**Pardon Date**: <t:${Math.floor(ban.updatedAt.getTime() / 1000)}:R>
				**Pardon Mod**: ${pardonMod ? `<@${pardonMod.userId}> (@${pardonMod.userName})` : 'N/A'}` : ''}`;
			}

			var embed = new EmbedBuilder()
				.setColor('#00FFFF')
				.setTitle(await database.getMessage('INTERACTION_ADMIN_GET_SERVER_BAN_HISTORY_EMBED_TITLE', interaction) ?? 'INTERACTION_ADMIN_GET_SERVER_BAN_HISTORY_EMBED_TITLE')
				.setDescription(description);
			const banButton = await getBanButton(interaction, serverId, database);

			await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(banButton) as any] });
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_BAN_HISTORY', {}, false);
			break;
		}
		}
	},
	async executeModal(interaction : ModalSubmitInteraction, database : any) {
		switch (interaction.customId.split(';')[0]) {
		case 'admin_get_server_ban_confirm': {
			const serverId = interaction.customId.split(';')[1];
			if (!serverId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_BAN_CONFIRM_ERROR', {}, false);

			const models = (database.connection as Sequelize).models;
			const server : any = await models.Server.findOne({ where: { serverId: serverId } });
			if (!server) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_BAN_CONFIRM_ERROR_ID_NOT_FOUND', {}, false);

			const ban = await models.ServerBan.findOne({ where: { serverId: serverId, pardonModId: null } });
			if (ban) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_BAN_CONFIRM_ERROR_ALREADY_BANNED', { 'SERVER': `"${server.serverName ?? 'N/A'}" (${serverId})` });

			const reason = interaction.fields.getTextInputValue('admin_get_server_ban_confirm_reason');
			const modId = interaction.user.id;

			await models.ServerBan.create({ serverId: serverId, reason: reason, modId: modId });
			const { embeds, components } = await getReply(interaction, server, database);
			await interaction.reply({
				content: await database.getMessage('INTERACTION_ADMIN_GET_SERVER_BAN_SUCCESS', interaction, { 'SERVER': `"${server.serverName ?? 'N/A'}" (${serverId})` }) ?? 'INTERACTION_ADMIN_GET_SERVER_BAN_SUCCESS',
				embeds: embeds, components: components as any,
			});
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_BAN_SUCCESS', { 'SERVER_ID': serverId }, false);
			break;
		}
		case 'admin_get_server_pardon_confirm': {
			const banId = interaction.customId.split(';')[1];
			if (!banId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_PARDON_CONFIRM_ERROR', {}, false);

			const models = (database.connection as Sequelize).models;
			const ban : any = await models.ServerBan.findOne({ where: { banId: banId } });
			if (!ban) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_PARDON_CONFIRM_ERROR_ID_NOT_FOUND', {}, false);

			const server : any = await models.Server.findOne({ where: { serverId: ban.serverId } });
			if (!server) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_PARDON_CONFIRM_ERROR_SERVER_NOT_FOUND', {}, false);

			if (ban.pardonModId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_PARDON_CONFIRM_ERROR_ALREADY_PARDONED', { 'SERVER': `"${server.serverName ?? 'N/A'}" (${ban.serverId})` });

			const pardonReason = interaction.fields.getTextInputValue('admin_get_server_pardon_confirm_reason');
			const pardonModId = interaction.user.id;

			await ban.update({ pardonReason: pardonReason, pardonModId: pardonModId });
			const { embeds, components } = await getReply(interaction, server, database);
			await interaction.reply({
				content: await database.getMessage('INTERACTION_ADMIN_GET_SERVER_PARDON_SUCCESS', interaction, { 'SERVER': `"${server.serverName ?? 'N/A'}" (${ban.serverId})` }) ?? 'INTERACTION_ADMIN_GET_SERVER_PARDON_SUCCESS',
				embeds: embeds, components: components as any,
			});
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_SERVER_PARDON_SUCCESS', { SERVER_ID: ban.serverId }, false);
			break;
		}
		}
	},
	getReply,
	getBanButton,
};

async function getReply(interaction : Interaction, server: any, database : any) : Promise<{ embeds: [EmbedBuilder], components: [ActionRowBuilder] }> {
	const bin = (+server.serverId).toString(2);
	const diff = 64 - (+server.serverId).toString(2).length;
	const created = parseInt(bin.substring(0, 42 - diff), 2) + 1420070400000;

	const models = (database.connection as Sequelize).models;
	const ban = await models.ServerBan.findOne({ where: { serverId: server.serverId } });
	const currentBan : any = await models.ServerBan.findOne({ where: { serverId: server.serverId, pardonModId: null } });

	const embed = new EmbedBuilder()
		.setColor('#00FFFF')
		.setTitle(await database.getMessage('INTERACTION_ADMIN_GET_SERVER_EMBED_TITLE', interaction) ?? 'INTERACTION_ADMIN_GET_SERVER_EMBED_TITLE')
		.setDescription(await database.getMessage('INTERACTION_ADMIN_GET_SERVER_EMBED', interaction) ?? 'INTERACTION_ADMIN_GET_SERVER_EMBED')
		.setImage(`https://cdn.discordapp.com/icons/${server.serverId}/${server.serverPicture}.webp`)
		.addFields(
			{ name: 'Server ID', value: server.serverId, inline: true },
			{ name: 'Server Name', value: server.serverName ?? 'N/A', inline: true },
			{ name: 'Owner', value: `<@${server.ownerId}>`, inline: true },
			{ name: 'Shard ID', value: server.shardId.toString(), inline: true },
			{ name: 'Member Count', value: server.memberCount.toString(), inline: true },
			{ name: 'Bot Join', value: `<t:${Math.floor(server.botJoin / 1000)}:R>`, inline: true },
			{ name: 'Bot Leave', value: server.botLeave ? `<t:${Math.floor(server.botLeave / 1000)}:R>` : 'N/A', inline: true },
			{ name: 'Server Creation', value: `<t:${Math.floor(created / 1000)}:R>`, inline: true },
			{ name: 'Ban Status', value: currentBan ? 'Banned' : ban ? 'Previously Banned' : 'Not Banned', inline: true },
		);


	const viewUsersButton = new ButtonBuilder()
		.setCustomId(`admin_get_server_users;${server.serverId}`)
		.setLabel('View Users')
		.setStyle(ButtonStyle.Secondary)
		.setEmoji('👥');


	const banButton = await getBanButton(interaction, server.serverId, database);
	const banHistoryButton = new ButtonBuilder()
		.setCustomId(`admin_get_server_ban_history;${server.serverId}`)
		.setLabel('Ban History')
		.setStyle(ButtonStyle.Secondary)
		.setEmoji('📜');

	const row = new ActionRowBuilder().addComponents(viewUsersButton, banButton);
	if (ban) row.addComponents(banHistoryButton);

	return { embeds: [embed], components: [row] };
}

async function getBanButton(interaction : Interaction, serverId : string, database : any) : Promise<ButtonBuilder> {
	const models = (database.connection as Sequelize).models;
	const currentBan : any = await models.ServerBan.findOne({ where: { serverId: serverId, pardonModId: null } });

	const banButton = new ButtonBuilder()
		.setCustomId(`admin_get_server_ban;${serverId}`)
		.setLabel('Ban Server')
		.setStyle(ButtonStyle.Danger)
		.setEmoji('🔨')
		.setDisabled(interaction.guild.id == serverId);
	const pardonButton = new ButtonBuilder()
		.setCustomId(`admin_get_server_pardon;${currentBan ? currentBan.banId : ''}`)
		.setLabel('Pardon Server')
		.setStyle(ButtonStyle.Success)
		.setEmoji('🔓');

	return currentBan ? pardonButton : banButton;
}