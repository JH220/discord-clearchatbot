import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class Interaction extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			interactionId: {
				type: DataTypes.STRING(30),
				primaryKey: true,
			},
			serverId: { type: DataTypes.STRING(30) },
			channelId: { type: DataTypes.STRING(30) },
			channelName: { type: DataTypes.STRING(100) },
			userId: { type: DataTypes.STRING(30) },
			command: { type: DataTypes.STRING },
			result: { type: DataTypes.STRING },
			args: { type: DataTypes.TEXT },
		}, {
			tableName: 'interactions',
			sequelize,
		});
	}
};