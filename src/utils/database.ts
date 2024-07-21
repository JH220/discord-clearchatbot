import { Model, Sequelize } from 'sequelize';
import { Logger } from './logger';
import { Interaction as DInteraction, Guild, User as DUser, ChatInputCommandInteraction, PermissionsBitField, ChannelType } from 'discord.js';

module.exports = class database {
	static instance: database;
	logger: Logger;

	constructor() {
		if (database.instance instanceof database) return database.instance;
		database.instance = this;
		return this;
	}

	async setup(logger: Logger) : Promise<Sequelize> {
		this.logger = logger;
		if (this.connection) return this.connection;

		logger.debug('Connecting to database...');

		const connectionString : string = require('../../config.json').database;

		if (connectionString.startsWith('postgres://'))
			this.connection = await new Sequelize(connectionString, {
				ssl: false,
				logging: msg => logger.trace('[Sequelize] ' + msg),
			});
		else
			this.connection = await new Sequelize(connectionString, { logging: msg => logger.trace('[Sequelize] ' + msg) });

		logger.debug('[Database] Syncing models...');
		const modelFiles = require('node:fs').readdirSync('./dist/models').filter(file => file.endsWith('.js'));
		for (const file of modelFiles) {
			logger.debug(`[Database] Syncing model ${file}`);
			const modelFile : any = require(`../models/${file}`);
			await modelFile.init(this.connection);
			await modelFile.sync({ alter: true });
		}
		logger.debug('[Database] Models synced.');

		logger.debug('[Database] Database setup complete.');
		return this.connection;
	}

	async addInteraction(interaction : DInteraction) : Promise<Model> {
		const Interaction = this.connection.models.Interaction;

		await this.updateUser(interaction.user);
		if (interaction.inGuild()) await this.updateServer(interaction.guild);

		const dbInteraction : Model = await Interaction.create({
			interactionId: interaction.id,
			serverId: interaction.inGuild() ? interaction.guildId : null,
			channelId: interaction.channelId,
			channelName: interaction.channel.type == ChannelType.GuildText ? interaction.channel.name : null,
			userId: interaction.user.id,
			command: interaction.toString(),
			result: 'WAITING_FOR_RESPONSE',
		});
		this.logger.debug(`[Interaction ${interaction.id}] Added to database.`);
		return dbInteraction;
	}

	async reply(interaction : DInteraction, result : string, args : { [key: string]: string } = null, reply : boolean = true) : Promise<boolean> {
		const Interaction = this.connection.models.Interaction;
		const dbInteraction : Model = await Interaction.findOne({ where: { interactionId: interaction.id } });

		if (!dbInteraction) {
			this.logger.warn(`[Interaction ${interaction.id}] Not found in database while replying.`);
			if (!await this.addInteraction(interaction)) {
				this.logger.error(`[Interaction ${interaction.id}] Failed to add interaction to database while replying.`);
				return false;
			}
		}

		await Interaction.update({ result: result, args: args ? JSON.stringify(args) : null }, { where: { interactionId: interaction.id } });

		const argString = (args && args.length ? ' with args ' + (Object.keys(args).map(key => `"${key}": "${args[key]}"`).join(', ')) : '');
		if (!reply) {
			this.logger.debug(`[Interaction ${interaction.id}] Logged result ${result}${argString}.`);
			return true;
		}

		let message;

		try {
			message = await this.getMessage(result, interaction, args);
		}
		catch (error) {
			this.logger.warn(`[Interaction ${interaction.id}] Message ${result} not found in messages.json.`);
			message = result;
		}

		try {
			if (interaction.isChatInputCommand() && (interaction as ChatInputCommandInteraction).deferred) await interaction.editReply(message);
			else if (interaction.isRepliable()) await interaction.reply({ content: message, ephemeral: true });
			else return false;
		}
		catch (error) {
			this.logger.error(`[Interaction ${interaction.id}] Failed to reply with message ${result}.${error.stack ? `\n${error.stack}` : ''}`);
			return false;
		}

		this.logger.debug(`[Interaction ${interaction.id}] Replied with message ${result}${argString}.`);
		return true;
	}

	async updateServer(guild : Guild) {
		const Server = this.connection.models.Server;
		let server : Model = await Server.findOne({ where: { serverId: guild.id } });

		const iconURL = guild.iconURL();
		const icon = iconURL.substring(iconURL.lastIndexOf('/') + 1, iconURL.lastIndexOf('.'));

		if (!server) {
			server = await Server.create({
				serverId: guild.id,
				serverName: guild.name,
				serverPicture: icon,
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
			serverPicture: icon,
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

		const avatarURL = user.displayAvatarURL();
		const avatar = avatarURL.substring(avatarURL.lastIndexOf('/') + 1, avatarURL.lastIndexOf('.'));

		if (!dbUser) {
			dbUser = await User.create({
				userId: user.id,
				userName: user.username,
				userPicture: avatar,
			});
			this.logger.debug(`User ${user.id} added to database.`);
		}
		else dbUser.update({
			userName: user.username,
			userPicture: avatar,
		});

		return dbUser;
	}

	async getMessage(key : string, interaction: DInteraction = null, args : { [key: string]: string } = null) : Promise<string> {
		const messages = require('../../messages.json');

		if (!Object.prototype.hasOwnProperty.call(messages, key))
			throw 'INVALID_KEY';

		let message : string = messages[key];

		if (args)
			for (const arg in args)
				message = message.replace(new RegExp(`{${arg}}`, 'g'), args[arg]);

		if (interaction) {
			message = message.replace(/{INTERACTION_ID}/g, interaction.id);
			if (interaction.channel) message = message.replace(/{CHANNEL_ID}/g, interaction.channel.id).replace(/{CHANNEL_NAME}/g, interaction.channel.name);
			message = message.replace(/{USER_ID}/g, interaction.user.id).replace(/{USER_NAME}/g, interaction.user.username);

			if (interaction.inGuild()) {
				message = message.replace(/{SHARD_ID}/g, (interaction.guild.shardId + 1).toString());
				message = message.replace(/{GUILD_ID}/g, interaction.guild.id).replace(/{SERVER_ID}/g, interaction.guild.id).replace(/{SERVER_NAME}/g, interaction.guild.name);
			}

			if (interaction.isCommand()) {
				message = message.replace(/{COMMAND_NAME}/g, interaction.commandName);
				message = message.replace(/{COMMAND_ID}/g, interaction.commandId);
			}
		}

		const missingArgs = message.matchAll(/{(\w+)}/g);
		for (const match of missingArgs) {
			const arg = match[1];
			this.logger.warn(`${interaction ? `[Interaction ${interaction.id}] ` : ''}Message ${key} is missing argument "${arg}".`);
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