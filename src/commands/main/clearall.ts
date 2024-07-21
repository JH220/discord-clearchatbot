import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType, ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { CustomClient } from '../../bot';
import { Sequelize } from 'sequelize';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clearall')
		.setDescription('♻️ Clears all messages in a channel')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setDMPermission(false),
	/** @param {import('discord.js').CommandInteraction} interaction */
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();

		if (interaction.channel.type !== ChannelType.GuildText)
			return await database.reply(interaction, 'COMMAND_CLEARALL_INVALID_CHANNEL');

		// Checking permissions for cloning and deleting channel
		const member = interaction.guild.members.me;
		if (!member.permissionsIn(interaction.channel).has(PermissionsBitField.Flags.ManageChannels))
			return await database.reply(interaction, 'COMMAND_CLEARALL_MISSING_CHANNEL_PERM', { 'PERMISSION': 'Manage Channels' });
		if (interaction.channel.parent) {
			if (!member.permissionsIn(interaction.channel.parent).has(PermissionsBitField.Flags.ManageChannels))
				return await database.reply(interaction, 'COMMAND_CLEARALL_MISSING_CATEGORY_PERM', { 'PERMISSION': 'Manage Channels' });
		}
		else if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels))
			return await database.reply(interaction, 'COMMAND_CLEARALL_MISSING_GUILD_PERM', { 'PERMISSION': 'Manage Channels' });

		if (!interaction.channel.deletable)
			return await database.reply(interaction, 'COMMAND_CLEARALL_DELETE_ERROR');

		var channel;

		try {
			channel = await interaction.channel.clone();
			await interaction.channel.delete();
		}
		catch (error) {
			(interaction.client as CustomClient).ierror(interaction, error, 'Error while cloning and deleting channel');
			return await database.reply(interaction, 'COMMAND_CLEARALL_ERROR');
		}

		await database.reply(interaction, 'COMMAND_CLEARALL_PENDING', {}, false);
		await database.reply(interaction, 'COMMAND_CLEARALL_SUCCESS', { 'CHANNEL': `<#${channel.id}>` }, false);


		const settings : any = await (database.connection as Sequelize).models.ServerSetting.findOne({ where: { serverId: interaction.guildId } });
		if (!(settings?.showreply ?? true)) return;

		try {
			channel.send(await database.getMessage('COMMAND_CLEARALL_SUCCESS', interaction));
		}
		catch (error) {
			await (interaction.client as CustomClient).ierror(interaction, error, 'Error while sending message to new channel');
			await database.reply(interaction, 'COMMAND_CLEARALL_MESSAGE_ERROR', {}, false);
		}
	},
};