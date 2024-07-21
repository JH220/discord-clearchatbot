import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CustomClient } from '../../../../bot';
import { Sequelize } from 'sequelize';

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any, user : any) {
		const models = (database.connection as Sequelize).models;

		const bin = (+user.userId).toString(2);
		const diff = 64 - (+user.userId).toString(2).length;
		const created = parseInt(bin.substring(0, 42 - diff), 2) + 1420070400000;

		const ban = await models.UserBan.findOne({ where: { userId: user.userId } });
		const currentBan = await models.UserBan.findOne({ where: { userId: user.userId, pardonModId: null } });

		const embed = new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle('ClearChat-Bot Admin User Information 📊')
			.setDescription(await database.getMessage('COMMAND_ADMIN_GET_USER_EMBED', interaction))
			.setImage(`https://cdn.discordapp.com/avatars/${user.userId}/${user.userPicture}.webp`)
			.addFields(
				{ name: 'User ID', value: user.userId, inline: false },
				{ name: 'Username', value: '@' + user.userName, inline: true },
				{ name: 'Mention', value: `<@${user.userId}>`, inline: true },
				{ name: 'Account Creation', value: `<t:${Math.floor(created / 1000)}:R>`, inline: false	 },
				{ name: 'Ban Status', value: currentBan ? 'Banned' : ban ? 'Previously Banned' : 'Not Banned', inline: false },
			);


		const viewServersButton = new ButtonBuilder()
			.setCustomId('admin_get_user_servers')
			.setLabel('View Servers')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('🏰');

		const banButton = new ButtonBuilder()
			.setCustomId('admin_get_user_ban')
			.setLabel('Ban User')
			.setStyle(ButtonStyle.Danger)
			.setEmoji('🔨');
		const pardonButton = new ButtonBuilder()
			.setCustomId('admin_get_user_pardon')
			.setLabel('Pardon User')
			.setStyle(ButtonStyle.Success)
			.setEmoji('🔓');
		const banHistoryButton = new ButtonBuilder()
			.setCustomId('admin_get_user_ban_history')
			.setLabel('Ban History')
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('📜');

		const row = new ActionRowBuilder().addComponents(
			viewServersButton,
			currentBan ? pardonButton : banButton,
			ban ? banHistoryButton : null,
		);

		// @ts-ignore
		await interaction.reply({ embeds: [embed], components: [row] });
		await database.reply(interaction, 'COMMAND_ADMIN_GET_USER_SUCCESS', {}, false);
		await (interaction.client as CustomClient).idebug(interaction, 'Replied to admin get user command.');
	},
	async executeButton(interaction : ButtonInteraction, database : any) {
		database.reply(interaction, 'INTERACTION_ADMIN_GET_USER');
	},
};