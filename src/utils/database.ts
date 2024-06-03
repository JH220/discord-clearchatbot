import { Model, Sequelize } from 'sequelize';
import { Logger } from './logger';
import { Interaction as DInteraction, Guild, User as DUser, ChatInputCommandInteraction, PermissionsBitField, ChannelType } from 'discord.js';

module.exports = class database {
	static instance: database;
	logger: Logger;

	constructor() {
		if (database.instance instanceof database) return database.instance;
		database.instance = this;
	}

	async setup(logger: Logger) : Promise<Sequelize> {
		this.logger = logger;
		if (this.connection) return this.connection;

		logger.debug('Connecting to database...');
		this.connection = await new Sequelize(require('../../config.json').database, { logging: msg => logger.trace(msg) });

		logger.debug('Syncing models...');
		const modelFiles = require('node:fs').readdirSync('./dist/models').filter(file => file.endsWith('.js'));
		for (const file of modelFiles) {
			logger.debug(`Syncing model ${file}`);
			const modelFile : any = require(`../models/${file}`);
			await modelFile.init(this.connection);
			await modelFile.sync({ alter: true });
		}
		logger.debug('Models synced.');

		logger.debug('Database setup complete.');
		return this.connection;
	}

	async addInteraction(interaction : DInteraction) : Promise<Model> {
		const Interaction = this.connection.models.Interaction;

		await this.updateUser(interaction.user);
		if (interaction.inGuild()) await this.updateServer(interaction.guild);

		return await Interaction.create({
			interactionId: interaction.id,
			serverId: interaction.inGuild() ? interaction.guildId : null,
			channelId: interaction.channelId,
			channelName: interaction.channel.type == ChannelType.GuildText ? interaction.channel.name : null,
			userId: interaction.user.id,
			command: interaction.toString(),
			result: 'WAITING_FOR_RESPONSE',
		});
	}

	async reply(interaction : ChatInputCommandInteraction, result : string, args : Array<any> = null, reply : boolean = true) : Promise<boolean> {
		if (!interaction.isChatInputCommand()) return false;

		const Interaction = this.connection.models.Interaction;
		const dbInteraction : Model = await Interaction.findOne({ where: { interactionId: interaction.id } });

		if (!dbInteraction) {
			this.logger.warn(`Interaction ${interaction.id} not found in database.`);
			if (!await this.addInteraction(interaction)) {
				this.logger.error(`Failed to add interaction ${interaction.id} to database.`);
				return false;
			}
		}

		await Interaction.update({ result: result, args: args ? JSON.stringify(args) : null }, { where: { interactionId: interaction.id } });

		let message;

		try {
			message = await this.getMessage(result, interaction, args);
		}
		catch (error) {
			this.logger.error(`Failed to get message for ${result}.`);
			return false;
		}

		if (!reply) return true;
		if (interaction.deferred) await interaction.editReply(message);
		else if (interaction.isRepliable()) await interaction.reply({ content: message, ephemeral: true });
		else return false;

		this.logger.debug(`Replied to interaction ${interaction.id} with message ${result}.`);
		return true;
	}

	async updateServer(guild : Guild) {
		const Server = this.connection.models.Server;
		let server : Model = await Server.findOne({ where: { serverId: guild.id } });

		if (!server) {
			server = await Server.create({
				serverId: guild.id,
				serverName: guild.name,
				serverPicture: guild.iconURL(),
				created: guild.createdTimestamp,
				shardId: guild.shardId + 1,
				invites: JSON.stringify(await getInvites(guild)),
				memberCount: guild.memberCount,
				ownerId: guild.ownerId,
				botJoin: guild.joinedTimestamp,
			});
			this.logger.debug(`Server ${guild.id} added to database.`);
		}
		else server.update({
			serverName: guild.name,
			serverPicture: guild.iconURL(),
			shardId: guild.shardId + 1,
			invites: JSON.stringify(await getInvites(guild)),
			memberCount: guild.memberCount,
			ownerId: guild.ownerId,
		});

		return server;
	}

	async updateUser(user: DUser) {
		const User = this.connection.models.User;
		let dbUser : Model = await User.findOne({ where: { userId: user.id } });

		if (!dbUser) {
			dbUser = await User.create({
				userId: user.id,
				userName: user.username,
				userPicture: user.displayAvatarURL(),
				created: user.createdTimestamp,
			});
			this.logger.debug(`User ${user.id} added to database.`);
		}
		else dbUser.update({
			userName: user.username,
			userPicture: user.displayAvatarURL(),
		});

		return dbUser;
	}

	async getMessage(key : string, interaction: DInteraction = null, args : Array<any> = null) : Promise<string> {
		const messages = require('../../messages.json');

		if (!Object.prototype.hasOwnProperty.call(messages, key)) {
			this.logger.warn(`Message ${key} not found in messages.json.`);
			throw 'INVALID_KEY';
		}

		let message : string = messages[key];

		if (args)
			for (let i = 0; i < args.length; i++)
				message = message.replace(`{${i}}`, args[i]);

		if (interaction) {
			message = message.replace('{INTERACTION_ID}', interaction.id);
			if (interaction.channel) message = message.replace('{CHANNEL_ID}', interaction.channel.id).replace('{CHANNEL_NAME}', interaction.channel.name);
			message = message.replace('{USER_ID}', interaction.user.id).replace('{USER_NAME}', interaction.user.username);

			if (interaction.inGuild()) {
				message = message.replace('{SHARD_ID}', (interaction.guild.shardId + 1).toString());
				message = message.replace('{GUILD_ID}', interaction.guild.id).replace('{SERVER_NAME}', interaction.guild.name);
			}

			if (interaction.isCommand()) {
				message = message.replace('{COMMAND_NAME}', interaction.commandName);
				message = message.replace('{COMMAND_ID}', interaction.commandId);
			}
		}

		return message;
	}

	connection: Sequelize;
	getConnection() {
		return this.connection;
	}
};

async function getInvites(guild : Guild) {
	const invites = [];
	if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuild)) return null;
	const fetchedInvites = await guild.invites.fetch();

	for (const invite of fetchedInvites.values()) {
		if (invite.maxUses === 0 || invite.uses < invite.maxUses) invites.push(invite);
		if (invites.length >= 5) break;
	}

	return invites;
}