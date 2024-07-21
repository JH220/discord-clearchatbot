import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction } from 'discord.js';
import { Sequelize } from 'sequelize';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('admin')
		.setDescription('This command is used for debug and is only enabled on this server.')
		.setDefaultMemberPermissions('0')
		.setDMPermission(false)
		.addSubcommand(subcommand => subcommand
			.setName('get')
			.setDescription('Shows information about an ID.')
			.addStringOption(option => option.setName('id').setDescription('Enter an interaction, server, guild, user or ban ID here.').setRequired(true)),
		)
		.addSubcommand(subcommand => subcommand
			.setName('stats')
			.setDescription('Shows statistics about the bot.'),
		),
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();
		const models = (database.connection as Sequelize).models;

		switch (interaction.options.getSubcommand()) {
		case 'get': {
			const id = interaction.options.getString('id');

			let entry : any = await models.Interaction.findOne({ where: { interactionId: id } });
			if (entry) return require('./admin/get/interaction').execute(interaction, database, entry);

			entry = await models.User.findOne({ where: { userId: id } });
			if (entry) return require('./admin/get/user').execute(interaction, database, entry);

			entry = await models.Server.findOne({ where: { serverId: id } });
			if (entry) return require('./admin/get/server').execute(interaction, database, entry);

			entry = await models.UserBan.findOne({ where: { banId: id.replace(/^BU/, '') } });
			if (entry) {
				const user = await models.User.findOne({ where: { userId: entry.userId } });
				return require('./admin/get/user').execute(interaction, database, user);
			}

			entry = await models.ServerBan.findOne({ where: { banId: id.replace(/^BG/, '') } });
			if (entry) {
				const server = await models.Server.findOne({ where: { serverId: entry.serverId } });
				return require('./admin/get/server').execute(interaction, database, server);
			}

			return database.reply(interaction, 'COMMAND_ADMIN_INVALID_ID', { 'ID': id });
		}
		case 'stats': return require('./admin/stats').execute(interaction, database);
		case 'ban': return require('./admin/ban').execute(interaction, database);
		}
	},
};