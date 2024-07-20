import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('✨ Vote for this bot and get exclusive features!'),
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();

		await interaction.reply({ embeds: [ new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle('ClearChat-Bot Vote Infos ✨')
			.setDescription(await database.getMessage('COMMAND_VOTE_EMBED', interaction)),
		] });

		await database.reply(interaction, 'COMMAND_VOTE_SUCCESS', {}, false);
		await (interaction.client as CustomClient).idebug(interaction, 'Replied to vote command.');
	},
};