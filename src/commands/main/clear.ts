import { SlashCommandBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('♻️ Clears the message history by a specified amount of messages and some additional filters.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.setDMPermission(false)
		.addIntegerOption(option => option
			.setName('amount')
			.setDescription('Number of messages to clear')
			.setMinValue(1)
			.setMaxValue(100),
		)
		.addUserOption(option => option.setName('user').setDescription('Filter messages from a specific user'))
		.addRoleOption(option => option.setName('role').setDescription('Filter messages from a specific role'))
		.addBooleanOption(option => option.setName('bot').setDescription('Filter messages sent by bots')),
	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction : ChatInputCommandInteraction) {
		interaction.deferReply({ ephemeral: true });
		const database = new (require('../../utils/database'))();
		const amount = interaction.options.getInteger('amount') || 100;

		const permissions = interaction.channel.permissionsFor(interaction.client.user);

		// Checking permissions for feedback to the user which permission is missing
		if (!permissions.has(PermissionsBitField.Flags.ManageMessages))
			return await database.reply(interaction, 'COMMAND_CLEAR_MISSING_PERMS', { 'PERMISSION': 'Manage Messages' });
		else if (!permissions.has(PermissionsBitField.Flags.ViewChannel))
			return await database.reply(interaction, 'COMMAND_CLEAR_MISSING_PERMS', { 'PERMISSION': 'View Channel' });
		else if (!permissions.has(PermissionsBitField.Flags.ReadMessageHistory))
			return await database.reply(interaction, 'COMMAND_CLEAR_MISSING_PERMS', { 'PERMISSION': 'Read Message History' });

		let fetched = await interaction.channel.messages.fetch({ limit: amount });
		fetched = fetched.filter(message => message.deletable);
		fetched = fetched.filter(message => !message.pinned);

		// Filter messages from a specific user if specified
		const user = interaction.options.getUser('user');
		if (user) fetched = fetched.filter(message => message.author.id == user.id);
		// Filter messages from a specific role if specified
		const role = interaction.options.getRole('role');
		if (role) fetched = fetched.filter(message => message.member && message.member.roles.cache.has(role.id));
		// Filter messages from bots if specified
		const bot = interaction.options.getBoolean('bot');
		if (bot) fetched = fetched.filter(message => message.member && message.member.user.bot);

		try {
			const messages = await interaction.channel.bulkDelete(fetched, true);
			await database.reply(interaction, 'COMMAND_CLEAR_SUCCESS', { 'AMOUNT': messages.size, 's': messages.size == 1 ? '' : 's' }, false);
		}
		catch (error) {
			(interaction.client as CustomClient).ierror(interaction, error, 'Error while bulk deleting messages');
			await database.reply(interaction, 'COMMAND_CLEAR_BULK_DELETE_ERROR');
		}
	},
};