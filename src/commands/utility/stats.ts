import { ChatInputCommandInteraction, EmbedBuilder, Guild, SlashCommandBuilder } from 'discord.js';
import { CustomClient } from '../../bot';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Shows the bot\'s stats.'),
	async execute(interaction : ChatInputCommandInteraction) {
		const database = new (require('../../utils/database'))();

		const serverCount = (await interaction.client.shard.fetchClientValues('guilds.cache.size')).reduce((acc : number, guildCount : number) => acc + guildCount, 0);
		const serverCountString = serverCount.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
		const memberCount = await interaction.client.shard.broadcastEval(c => c.guilds.cache.reduce((acc : number, guild : Guild) => acc + guild.memberCount, 0));
		const memberCountString = memberCount.reduce((acc, memberCountTmp) => acc + memberCountTmp, 0).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');

		const embed = new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle('ClearChat-Bot Stats 📊')
			.setDescription('Here are the stats for the bot.')
			.addFields(
				{ name: 'Servers', value: `${serverCountString} servers`, inline: false },
				{ name: 'Members', value: `${memberCountString} members`, inline: false },
				{ name: 'Shard', value: `${interaction.guild.shardId + 1}`, inline: false },
				{ name: 'Ping', value: `${interaction.client.ws.ping} ms`, inline: false },
			);
		await interaction.reply({ embeds: [embed] });
		await database.reply(interaction, 'COMMAND_STATS_SUCCESS', {}, false);
		await (interaction.client as CustomClient).idebug(interaction, 'Replied to stats command.');
	},
};