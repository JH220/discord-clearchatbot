import logger from './sharding/logger';
logger.info('Starting Discord ClearChat Bot...');
const botStart : number = Date.now();

import events from './sharding/events';
events.process(logger);

import { ShardingManager } from 'discord.js';
const token : string = require('../config.json').token;
const manager : ShardingManager = new ShardingManager('./dist/bot.js', { token: token });

const topgg : { enabled: boolean } = require('../config.json').topgg;
if (topgg.enabled) require('./utils/topgg').start(manager, logger);

manager.on('shardCreate', shard => events.shardCreate(logger, shard));

manager.spawn().then(() => {
	const time : string = (Date.now() - botStart).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
	logger.info(`Discord ClearChat Bot started! Startup process took ${time}ms`);
});