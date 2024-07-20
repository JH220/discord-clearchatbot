const { AutoPoster } = require('topgg-autoposter');
const { Webhook } = require('@top-gg/sdk');
const { topgg } = require('../../config.json');

module.exports = {
	async start(client, logger) {
		logger.info('Starting TopGG webhook server...');
		const connection = await new (require('./database'))().setup(logger);

		const app = require('express')();
		const webhook = new Webhook(topgg.webhook);

		const autoposter = AutoPoster(topgg.token, client);

		app.post('/', webhook.listener(async vote => {
			logger.debug(`Received vote from ${vote.user}.`);
			connection.models.Vote.create({ userId: vote.user });
		}));

		autoposter.on('posted', () => {
			logger.info('Posted stats to Top.gg!');
		});

		app.listen(topgg.port);
		logger.info('TopGG webhook server started!');
	},
};