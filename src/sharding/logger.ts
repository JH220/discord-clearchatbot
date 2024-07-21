import pino, { Logger, TransportMultiOptions, Level } from 'pino';

const log : LogConfig = require('../../config.json').log;
interface LogConfig {
    level: Level;
    webhook?: string;
    logtail?: string;
}

const transport : TransportMultiOptions = {
	targets: [
		{
			target: 'pino/file',
			level: 'debug',
			options: { destination: './ccbot.log' },
		},
		{
			target: './pretty-logger',
			level: log.level,
			options: {
				colorize: true,
				ignore: 'pid,hostname',
				hideObject: true,
			},
		},
	],
};

if (log.webhook)
	transport.targets = [
		...transport.targets,
		{
			target: 'pino-discord-webhook',
			level: 'info',
			options: {
				webhookURL: log.webhook,
			},
		},
	];
if (log.logtail)
	transport.targets = [
		...transport.targets,
		{
			target: '@logtail/pino',
			level: 'debug',
			options: {
				sourceToken: log.logtail,
			},
		},
	];

const logger : Logger = pino({ level: log.level }, pino.transport(transport));

export default logger;