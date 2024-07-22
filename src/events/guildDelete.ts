import { Events, Guild } from 'discord.js';
import { CustomClient } from '../bot';

module.exports = {
	name: Events.GuildDelete,
	once: true,
	execute(guild : Guild) {
		const database = new (require('../utils/database'))();
		const client = guild.client as CustomClient;

		if (!database.getConnection()) {
			client.error(`[Guild ${guild.id}] Failed to connect to the database.`);
			return;
		}

		const { models } = database.getConnection();

		models.Server.update({ botLeave: new Date() }, { where: { serverId: guild.id } });
		client.debug(`[Guild ${guild.id}] Left guild.`);
	},
};