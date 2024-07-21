import { Events } from 'discord.js';
import { CustomClient } from '../bot';

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client : CustomClient) {
		// Setting up the database
		new (require('../utils/database'))().setup(client);
	},
};