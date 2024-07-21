import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { CustomClient } from '../../../../bot';
import { Sequelize } from 'sequelize';

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any, server : any) {
		const models = (database.connection as Sequelize).models;

		/*
		Error [ERR_UNHANDLED_ERROR]: Unhandled error. ('INVALID_KEY')
    at new NodeError (node:internal/errors:406:5)
    at CustomClient.emit (node:events:503:17)
    at emitUnhandledRejectionOrErr (node:events:397:10)
    at process.processTicksAndRejections (node:internal/process/task_queues:84:21) {
  code: 'ERR_UNHANDLED_ERROR',
  context: 'INVALID_KEY'
}
  */
		const bin = (+server.serverId).toString(2);
		const diff = 64 - (+server.serverId).toString(2).length;
		const created = parseInt(bin.substring(0, 42 - diff), 2) + 1420070400000;

		const ban = await models.ServerBan.findOne({ where: { serverId: server.serverId } });
		const currentBan = await models.ServerBan.findOne({ where: { serverId: server.serverId, pardonModId: null } });

		await interaction.reply({ embeds: [ new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle('ClearChat-Bot Admin Server Information 📊')
			.setDescription(await database.getMessage('COMMAND_ADMIN_GET_SERVER_EMBED', interaction))
			.setImage(`https://cdn.discordapp.com/icons/${server.serverId}/${server.serverPicture}.webp`)
			.addFields(
				{ name: 'Server ID', value: server.serverId, inline: true },
				{ name: 'Server Name', value: server.serverName, inline: true },
				{ name: 'Owner', value: `<@${server.ownerId}>`, inline: true },
				{ name: 'Shard ID', value: server.shardId.toString(), inline: true },
				{ name: 'Member Count', value: server.memberCount.toString(), inline: true },
				{ name: 'Bot Join', value: `<t:${Math.floor(server.botJoin / 1000)}:R>`, inline: true },
				{ name: 'Bot Leave', value: server.botLeave ? `<t:${Math.floor(server.botLeave / 1000)}:R>` : 'N/A', inline: true },
				{ name: 'Server Creation', value: `<t:${Math.floor(created / 1000)}:R>`, inline: true },
				{ name: 'Ban Status', value: currentBan ? 'Banned' : ban ? 'Previously Banned' : 'Not Banned', inline: true },
			),
		] });

		await database.reply(interaction, 'COMMAND_ADMIN_GET_SERVER_SUCCESS', {}, false);
		await (interaction.client as CustomClient).idebug(interaction, 'Replied to admin get server command.');
	},
};