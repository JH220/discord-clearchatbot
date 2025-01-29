import { ChatInputCommandInteraction, Guild, GuildMember, Role } from 'discord.js';
import { CustomClient } from '../../../bot';

module.exports = {
	async execute(interaction : ChatInputCommandInteraction, database : any) {
		const client = (interaction.client as CustomClient);

		const addB = interaction.options.getBoolean('add');
		const gId = interaction.options.getString('guildid');
		const rId = interaction.options.getString('roleid');
		const uId = interaction.options.getString('userid');

		const broadcast = await client.shard.broadcastEval(async (c, { add, guildId, roleId, userId }) => {
			const guild : Guild = c.guilds.cache.get(guildId);
			if (!guild) return 'Guild not found.';
			const role : Role = guild.roles.cache.get(roleId);
			if (!role) return 'Role not found.';
			const member : GuildMember = guild.members.cache.get(userId);
			if (!member) return 'Member not found.';

			if (!role.editable) return 'No permission.';
			if (add) await member.roles.add(role);
			else await member.roles.remove(role);
			return 'Success.';
		}, { context: { add: addB, guildId: gId, roleId: rId, userId: uId } });

		const message = broadcast.find((element : string) => element !== 'Guild not found.') || 'Guild not found.';
		await interaction.reply(message);
		await database.reply(interaction, 'COMMAND_ADMIN_ROLE', { message: message }, false);
	},
};