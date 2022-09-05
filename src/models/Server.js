const { DataTypes, Model } = require('sequelize');

module.exports = class Server extends Model {
	static init(sequelize) {
		return super.init({
			serverId: {
				type: DataTypes.STRING(10),
				primaryKey: true,
			},
			guildId: { type: DataTypes.STRING(20) },
			serverName: { type: DataTypes.STRING(100) },
			serverPicture: { type: DataTypes.STRING },
			created: { type: DataTypes.DATE },
			shardId: { type: DataTypes.INTEGER(5) },
			invites: { type: DataTypes.TEXT },
			memberCount: { type: DataTypes.INTEGER(8) },
			ownerId: { type: DataTypes.STRING(20) },
			botJoin: { type: DataTypes.DATE },
			botLeave: { type: DataTypes.DATE },
		}, {
			tableName: 'servers',
			sequelize,
		});
	}
};