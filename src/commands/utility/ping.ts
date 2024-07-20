import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();
		await database.reply(interaction, 'COMMAND_PING', { 'SHARD': interaction.guild.shardId + 1, 'PING': interaction.client.ws.ping });
	},
};