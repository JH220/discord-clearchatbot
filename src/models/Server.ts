import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class Server extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			serverId: {
				type: DataTypes.STRING(30),
				primaryKey: true,
			},
			serverName: { type: DataTypes.STRING(100) },
			serverPicture: { type: DataTypes.STRING },
			created: { type: DataTypes.DATE },
			shardId: { type: DataTypes.INTEGER },
			invites: { type: DataTypes.TEXT },
			memberCount: { type: DataTypes.INTEGER },
			ownerId: { type: DataTypes.STRING(30) },
			botJoin: { type: DataTypes.DATE },
			botLeave: { type: DataTypes.DATE },
		}, {
			tableName: 'servers',
			sequelize,
		});
	}
};