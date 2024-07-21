import { Shard } from 'discord.js';
import { Logger } from 'pino';

export default {
	process(logger: Logger): void {
		process.on('SIGTERM', () => {
			logger.error('SIGTERM received.');
			logger.info('System shutdown signal received, exiting...');
			logger.info('Stopped Discord ClearChat Bot.');
			process.exit(0);
		});

		process.on('SIGINT', () => {
			logger.error('SIGINT received.');
			logger.info('Manual exit signal received, exiting...');
			logger.info('Stopped Discord ClearChat Bot.');
			process.exit(0);
		});
	},
	shardCreate(logger: Logger, shard: Shard): void {
		const childLogger = logger.child({ shard: shard.id + 1 });
		let start : number;

		shard.on('spawn', () => {
			start = Date.now();
			childLogger.info('Starting...');
		});
		shard.on('ready', () => {
			const time : string = (Date.now() - start).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
			childLogger.info(`Started! Startup process took ${time} ms.`);
			shard.fetchClientValue('guilds.cache.size').then(count => {
				childLogger.info(`Managing ${count} guild${count != 1 ? 's' : ''}.`);
			});

		});
		shard.on('reconnecting', () => childLogger.info('Reconnecting...'));
		shard.on('death', () => logger.error(`Shard ${shard.id + 1} died!`));

		shard.on('error', error => {
			childLogger.error(`Error:\n${error}`);
			shard.respawn();
		});

		shard.on('message', message => {
			if (message.type == 'log')
				childLogger[message.level](message.log);
		});
	},
};