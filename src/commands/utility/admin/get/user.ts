import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, Interaction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Sequelize } from 'sequelize';

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any, user : any) {
		await interaction.reply(await getReply(interaction, user, database) as any);
		await database.reply(interaction, 'COMMAND_ADMIN_GET_USER_SUCCESS', {}, false);
	},
	async executeButton(interaction : ButtonInteraction, database : any) {
		switch (interaction.customId.split(';')[0]) {
		case 'admin_get_user_servers': {
			await interaction.reply(interaction.customId);
			break;
		}
		case 'admin_get_user_ban': {
			const userId = interaction.customId.split(';')[1];
			if (!userId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_BAN_ERROR', {}, false);

			const modal = new ModalBuilder().setCustomId(`admin_get_user_ban_confirm;${userId}`).setTitle('User Ban Confirmation 📜');
			const banReason = new TextInputBuilder()
				.setCustomId('admin_get_user_ban_confirm_reason')
				.setLabel('Please provide a reason for the ban.')
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			modal.addComponents(new ActionRowBuilder().addComponents(banReason) as any);
			await interaction.showModal(modal);
			break;
		}
		case 'admin_get_user_pardon': {
			const banId = interaction.customId.split(';')[1];
			if (!banId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_PARDON_ERROR', {}, false);

			const modal = new ModalBuilder().setCustomId(`admin_get_user_pardon_confirm;${banId}`).setTitle('User Pardon Confirmation 📜');
			const pardonReason = new TextInputBuilder()
				.setCustomId('admin_get_user_pardon_confirm_reason')
				.setLabel('Please provide a reason for the pardon.')
				.setStyle(TextInputStyle.Short)
				.setRequired(false);

			modal.addComponents(new ActionRowBuilder().addComponents(pardonReason) as any);
			await interaction.showModal(modal);
			break;
		}
		case 'admin_get_user_ban_history': {
			const userId = interaction.customId.split(';')[1];
			if (!userId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_BAN_HISTORY_ERROR', {}, false);
			var description = '**User ID**: ' + userId + '\n\n**Ban History**:\n';
			const models = (database.connection as Sequelize).models;
			var bans = await models.UserBan.findAll({ where: { userId: userId } });

			// only show the last 5 bans
			if (bans.length > 5) {
				bans = bans.slice(bans.length - 5);
				description += 'Only showing the last 5 bans.\n';
			}
			else if (bans.length == 0)
				description += '\nNo ban history found for this user.';

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
				.setTitle(await database.getMessage('INTERACTION_ADMIN_GET_USER_BAN_HISTORY_EMBED_TITLE', interaction) ?? 'INTERACTION_ADMIN_GET_USER_BAN_HISTORY_EMBED_TITLE')
				.setDescription(description);
			const banButton = await getBanButton(interaction, userId, database);

			await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(banButton) as any] });
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_BAN_HISTORY', {}, false);
			break;
		}
		}
	},
	async executeModal(interaction : ModalSubmitInteraction, database : any) {
		switch (interaction.customId.split(';')[0]) {
		case 'admin_get_user_ban_confirm': {
			const userId = interaction.customId.split(';')[1];
			if (!userId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_BAN_CONFIRM_ERROR', {}, false);

			const models = (database.connection as Sequelize).models;
			const user : any = await models.User.findOne({ where: { userId: userId } });
			if (!user) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_BAN_CONFIRM_ERROR_ID_NOT_FOUND', {}, false);

			const ban = await models.UserBan.findOne({ where: { userId: userId, pardonModId: null } });
			if (ban) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_BAN_CONFIRM_ERROR_ALREADY_BANNED', { 'BAN_USER': `<@${userId}>` });

			const reason = interaction.fields.getTextInputValue('admin_get_user_ban_confirm_reason');
			const modId = interaction.user.id;

			await models.UserBan.create({ userId: userId, reason: reason, modId: modId });
			const { embeds, components } = await getReply(interaction, user, database);
			await interaction.reply({
				content: await database.getMessage('INTERACTION_ADMIN_GET_USER_BAN_SUCCESS', interaction, { 'BAN_USER': `<@${userId}>` }) ?? 'INTERACTION_ADMIN_GET_USER_BAN_SUCCESS',
				embeds: embeds, components: components as any,
			});
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_BAN_SUCCESS', { 'USER_ID': userId }, false);
			break;
		}
		case 'admin_get_user_pardon_confirm': {
			const banId = interaction.customId.split(';')[1];
			if (!banId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_PARDON_CONFIRM_ERROR', {}, false);

			const models = (database.connection as Sequelize).models;
			const ban : any = await models.UserBan.findOne({ where: { banId: banId } });
			if (!ban) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_PARDON_CONFIRM_ERROR_ID_NOT_FOUND', {}, false);

			if (ban.pardonModId) return await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_PARDON_CONFIRM_ERROR_ALREADY_PARDONED', { 'BAN_USER': `<@${ban.userId}>` });

			const user : any = await models.User.findOne({ where: { userId: ban.userId } });
			const pardonReason = interaction.fields.getTextInputValue('admin_get_user_pardon_confirm_reason');
			const pardonModId = interaction.user.id;

			await ban.update({ pardonReason: pardonReason, pardonModId: pardonModId });
			const { embeds, components } = await getReply(interaction, user, database);
			await interaction.reply({
				content: await database.getMessage('INTERACTION_ADMIN_GET_USER_PARDON_SUCCESS', interaction, { 'BAN_USER': `<@${ban.userId}>` }) ?? 'INTERACTION_ADMIN_GET_USER_PARDON_SUCCESS',
				embeds: embeds, components: components as any,
			});
			await database.reply(interaction, 'INTERACTION_ADMIN_GET_USER_PARDON_SUCCESS', { USER_ID: ban.userId }, false);
			break;
		}
		}
	},
	getReply,
	getBanButton,
};

async function getReply(interaction : Interaction, user: any, database : any) : Promise<{ embeds: [EmbedBuilder], components: [ActionRowBuilder] }> {
	const bin = (+user.userId).toString(2);
	const diff = 64 - (+user.userId).toString(2).length;
	const created = parseInt(bin.substring(0, 42 - diff), 2) + 1420070400000;

	const models = (database.connection as Sequelize).models;
	const currentBan : any = await models.UserBan.findOne({ where: { userId: user.userId, pardonModId: null } });
	const ban : any = await models.UserBan.findOne({ where: { userId: user.userId } });

	const embed = new EmbedBuilder()
		.setColor('#00FFFF')
		.setTitle(await database.getMessage('INTERACTION_ADMIN_GET_USER_EMBED_TITLE', interaction) ?? 'INTERACTION_ADMIN_GET_USER_EMBED_TITLE')
		.setDescription(await database.getMessage('INTERACTION_ADMIN_GET_USER_EMBED', interaction) ?? 'INTERACTION_ADMIN_GET_USER_EMBED')
		.setImage(`https://cdn.discordapp.com/avatars/${user.userId}/${user.userPicture}.webp`)
		.addFields(
			{ name: 'User ID', value: user.userId, inline: false },
			{ name: 'Username', value: '@' + user.userName, inline: true },
			{ name: 'Mention', value: `<@${user.userId}>`, inline: true },
			{ name: 'Account Creation', value: `<t:${Math.floor(created / 1000)}:R>`, inline: false	 },
			{ name: 'Ban Status', value: currentBan ? 'Banned' : ban ? 'Previously Banned' : 'Not Banned', inline: false },
		);


	const viewServersButton = new ButtonBuilder()
		.setCustomId(`admin_get_user_servers;${user.userId}`)
		.setLabel('View Servers')
		.setStyle(ButtonStyle.Secondary)
		.setEmoji('🏰');


	const banButton = await getBanButton(interaction, user.userId, database);
	const banHistoryButton = new ButtonBuilder()
		.setCustomId(`admin_get_user_ban_history;${user.userId}`)
		.setLabel('Ban History')
		.setStyle(ButtonStyle.Secondary)
		.setEmoji('📜');

	const row = new ActionRowBuilder().addComponents(viewServersButton, banButton);
	if (ban) row.addComponents(banHistoryButton);

	return { embeds: [embed], components: [row] };
}

async function getBanButton(interaction : Interaction, userId : string, database : any) : Promise<ButtonBuilder> {
	const models = (database.connection as Sequelize).models;
	const currentBan : any = await models.UserBan.findOne({ where: { userId: userId, pardonModId: null } });

	const banButton = new ButtonBuilder()
		.setCustomId(`admin_get_user_ban;${userId}`)
		.setLabel('Ban User')
		.setStyle(ButtonStyle.Danger)
		.setEmoji('🔨')
		.setDisabled(interaction.user.id == userId);
	const pardonButton = new ButtonBuilder()
		.setCustomId(`admin_get_user_pardon;${currentBan ? currentBan.banId : ''}`)
		.setLabel('Pardon User')
		.setStyle(ButtonStyle.Success)
		.setEmoji('🔓');

	return currentBan ? pardonButton : banButton;
}