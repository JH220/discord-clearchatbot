import { Events, Guild } from 'discord.js';
import { CustomClient } from '../bot';

module.exports = {
	name: Events.GuildCreate,
	once: true,
	execute(guild : Guild) {
		require('../utils/database').updateServer(guild);
		(guild.client as CustomClient).debug(`[Guild ${guild.id}] Joined guild ${guild.name}.`);
	},
};