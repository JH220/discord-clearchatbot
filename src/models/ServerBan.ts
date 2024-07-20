import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class ServerBan extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			banId: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			serverId: { type: DataTypes.STRING(18) },
			reason: { type: DataTypes.TEXT, allowNull: false },
			modId: { type: DataTypes.STRING(18) },
			pardonReason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
			pardonModId: { type: DataTypes.STRING(18), allowNull: true, defaultValue: null },
		}, {
			tableName: 'server_bans',
			sequelize,
		});
	}
};