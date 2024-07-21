import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settings')
		.setDescription('🔧 Shows the settings of the bot.')
		.setDefaultMemberPermissions('0')
		.setDMPermission(false),
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();

		await interaction.reply({ embeds: [ new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle('ClearChat-Bot Settings 🛠️')
			.setDescription(await database.getMessage('COMMAND_SETTINGS_EMBED', interaction)),
		] });

		await database.reply(interaction, 'COMMAND_SETTINGS_SUCCESS', {}, false);
		await (interaction.client as CustomClient).idebug(interaction, 'Replied to settings command');
	},
};