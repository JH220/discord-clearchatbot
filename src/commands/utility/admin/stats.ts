import { ChatInputCommandInteraction, EmbedBuilder, Guild } from 'discord.js';
import { CustomClient } from '../../../bot';

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any) {
		const startupTime = (interaction.client as CustomClient).startup;
		if (!startupTime) {
			await database.reply(interaction, 'COMMAND_ADMIN_STATS_STILL_STARTING');
			return;
		}

		const serverCount = (await interaction.client.shard.fetchClientValues('guilds.cache.size')).reduce((acc : number, guildCount : number) => acc + guildCount, 0);
		const serverCountString = serverCount.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');
		const memberCount = await interaction.client.shard.broadcastEval(c => c.guilds.cache.reduce((acc : number, guild : Guild) => acc + guild.memberCount, 0));
		const memberCountString = memberCount.reduce((acc, memberCountTmp) => acc + memberCountTmp, 0).toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',');

		const embed = new EmbedBuilder()
			.setColor('#00FFFF')
			.setTitle('ClearChat-Bot Admin Stats 📊')
			.addFields(
				{ name: 'Servers', value: `${serverCountString} servers`, inline: true },
				{ name: 'Members', value: `${memberCountString} members`, inline: true },
				{ name: 'Shard', value: `${interaction.guild.shardId + 1}/${interaction.client.shard.count}`, inline: false },
				{ name: 'Ping', value: `${interaction.client.ws.ping} ms`, inline: true },
				{ name: 'Uptime', value: formatTime(new Date().getTime() - startupTime.getTime()), inline: true },
			);
		await interaction.reply({ embeds: [embed] });
		await database.reply(interaction, 'COMMAND_ADMIN_STATS_SUCCESS', {}, false);
		await (interaction.client as CustomClient).idebug(interaction, 'Replied to stats command.');
	},
};

function formatTime(time : number) {
	// Calculate time units from milliseconds
	const seconds = Math.floor((time / 1000) % 60);
	const minutes = Math.floor((time / (1000 * 60)) % 60);
	const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
	const days = Math.floor(time / (1000 * 60 * 60 * 24));

	// Format string
	let output = '';
	if (days > 0) output += `${days} d `;
	if (hours > 0 || days > 0) output += `${hours} h `;
	if (minutes > 0 || hours > 0 || days > 0) output += `${minutes} min `;
	output += `${seconds} sec`;

	return output;
}