import { Client, Collection, GatewayIntentBits, Interaction } from 'discord.js';
import { Logger } from './utils/logger';

export class CustomClient extends Client implements Logger {
	commands: Collection<string, any>;
	startup: Date;

	log(message : string) {
		this._sendLog('info', message);
	}
	warn(message : string) {
		this._sendLog('warn', message);
	}
	debug(message : string) {
		this._sendLog('debug', message);
	}
	error(message : string) {
		this._sendLog('error', message);
	}
	trace(message : string) {
		this._sendLog('trace', message);
	}

	ierror(interaction : Interaction, error : Error = null, message : string = '') {
		this.error(`[Interaction ${interaction.id}] ${message ? message : 'Error while executing interaction'}: ${error}${error?.stack ? `\n${error.stack}` : ''}`);
	}
	idebug(interaction : Interaction, message : string) {
		this.debug(`[Interaction ${interaction.id}] ${message}`);
	}

	_sendLog(level : string, message : string) {
		this.shard.send({ type: 'log', level: level, log: message });
	}
}

const client: CustomClient = new CustomClient({ intents: [GatewayIntentBits.Guilds] });
client.startup = null;

import fileLoader from './utils/file-loader';
fileLoader.loadCommands(client);
fileLoader.loadEvents(client);

process.on('message', (message : any) => {
	if (message?.type == 'started' && !client.startup) {
		client.debug('Received startup message, now in full operation.');
		client.startup = new Date();
	}
});

const token : string = require('../config.json').token;
client.login(token);