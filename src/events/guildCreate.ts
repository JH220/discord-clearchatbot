import { Events, Guild } from 'discord.js';
import { CustomClient } from '../bot';

module.exports = {
	name: Events.GuildCreate,
	once: true,
	execute(guild : Guild) {
		const database = new (require('../utils/database'))();
		const client = guild.client as CustomClient;

		if (!database.getConnection()) {
			client.error(`[Guild ${guild.id}] Failed to connect to the database.`);
			return;
		}

		database.updateServer(guild);
		client.debug(`[Guild ${guild.id}] Joined guild ${guild.name}.`);
	},
};