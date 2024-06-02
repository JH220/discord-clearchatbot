import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class DisabledCommands extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			commandName: {
				type: DataTypes.STRING(20),
				primaryKey: true,
			},
			reason: { type: DataTypes.STRING(1000), allowNull: true },
			modId: { type: DataTypes.STRING(18) },
		}, {
			tableName: 'disabled_commands',
			sequelize,
		});
	}
};