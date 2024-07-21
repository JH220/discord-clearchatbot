import { ButtonInteraction, ChatInputCommandInteraction, Events, Interaction } from 'discord.js';

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction : Interaction) {
		const database = new (require('../utils/database'))();
		if (interaction.isChatInputCommand()) require('./interactions/chatInputCommand').execute(interaction as ChatInputCommandInteraction, database);
		if (interaction.isButton()) require('./interactions/button').execute(interaction as ButtonInteraction, database);
	},
};