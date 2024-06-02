import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class ServerSetting extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			serverId: {
				type: DataTypes.STRING(18),
				primaryKey: true,
			},
			showreply: { type: DataTypes.BOOLEAN },
		}, {
			tableName: 'server_settings',
			sequelize,
		});
	}
};