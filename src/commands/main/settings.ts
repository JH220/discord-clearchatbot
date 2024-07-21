import { SlashCommandBuilder } from '@discordjs/builders';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from 'discord.js';
import { CustomClient } from '../../bot';
import { Sequelize } from 'sequelize';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('🔧 Shows the settings of the bot.')
		.setDefaultMemberPermissions('0')
		.setDMPermission(false),
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();

		const select = new StringSelectMenuBuilder()
			.setCustomId('settings_select')
			.setPlaceholder('Select a setting to view')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Toggle confirmation messages')
					.setDescription('Toggles the confirmation message in the new channel when /clearall is run.')
					.setValue('toggle_confirmation_messages'),
			);
		const resetButton = new ButtonBuilder()
			.setCustomId('settings_reset')
			.setLabel(await database.getMessage('COMMAND_SETTINGS_BUTTON_RESET_ALL', interaction))
			.setStyle(ButtonStyle.Danger)
			.setEmoji('🔄');

		await interaction.reply({ embeds: [ new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle(await database.getMessage('COMMAND_SETTINGS_EMBED_TITLE', interaction))
			.setDescription(await database.getMessage('COMMAND_SETTINGS_EMBED', interaction)),
		], components: [new ActionRowBuilder().addComponents(select) as any, new ActionRowBuilder().addComponents(resetButton)] });

		await database.reply(interaction, 'COMMAND_SETTINGS_SUCCESS', {}, false);
		await (interaction.client as CustomClient).idebug(interaction, 'Replied to settings command');
	},
	async executeButton(interaction : ButtonInteraction, database : any) {
		const customId = interaction.customId.split(';')[0];
		if (customId != 'settings_reset') return;

		const models = (database.connection as Sequelize).models;
		await models.ServerSetting.destroy({ where: { serverId: interaction.guildId } });
		database.reply(interaction, 'INTERACTION_SETTINGS_RESET');
	},
	async executeStringSelectMenu(interaction : StringSelectMenuInteraction, database : any) {
		const customId = interaction.customId.split(';')[0];
		if (customId != 'settings_select') return;
		if (!interaction.values.includes('toggle_confirmation_messages')) return;

		const models = (database.connection as Sequelize).models;
		const setting : any = await models.ServerSetting.findOne({ where: { serverId: interaction.guildId } });
		const showreply = setting ? !setting.showreply : false;
		if (setting) setting.update({ showreply: showreply });
		else models.ServerSetting.create({ serverId: interaction.guildId, showreply: showreply });

		database.reply(interaction, 'INTERACTION_SETTINGS_TOGGLE_CONFIRMATION_MESSAGES', { 'STATE': showreply ? 'Enabled' : 'Disabled' });
	},
};