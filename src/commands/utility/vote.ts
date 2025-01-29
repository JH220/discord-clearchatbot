import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('✨ Vote for this bot and get exclusive features!'),
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();

		await interaction.reply({ embeds: [ new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle(await database.getMessage('COMMAND_VOTE_EMBED_TITLE', interaction) ?? 'COMMAND_VOTE_EMBED_TITLE')
			.setDescription(await database.getMessage('COMMAND_VOTE_EMBED', interaction) ?? 'COMMAND_VOTE_EMBED'),
		] });

		await database.reply(interaction, 'COMMAND_VOTE_SUCCESS', {}, false);
	},
};