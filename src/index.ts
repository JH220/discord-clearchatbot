import logger from './sharding/logger';
logger.info('Starting Discord ClearChat Bot...');
const botStart : number = Date.now();

import events from './sharding/events';
events.process(logger);

import { Collection, Shard, ShardingManager } from 'discord.js';
const token : string = require('../config.json').token;
const manager : ShardingManager = new ShardingManager('./dist/bot.js', { token: token });

const topgg : { enabled: boolean } = require('../config.json').topgg;
if (topgg.enabled) require('./utils/topgg').start(manager, logger);

manager.on('shardCreate', shard => events.shardCreate(logger, shard));

manager.spawn({ amount: 'auto', delay: 5000, timeout: 60000 }).then((shards : Collection<number, Shard>) => {
	const time : string = (Date.now() - botStart).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
	logger.info(`Finished starting all shards! Startup process took ${time} ms.`);
	shards.forEach(shard => shard.send({ type: 'started' }));
	manager.broadcast({ type: 'started' });
	// client event on broadcast:
	// client.on('broadcast', (message : any) => {
});