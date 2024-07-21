import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class DisabledCommand extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			commandName: {
				type: DataTypes.STRING(30),
				primaryKey: true,
			},
			reason: { type: DataTypes.STRING(1000), allowNull: true },
			modId: { type: DataTypes.STRING(30) },
		}, {
			tableName: 'disabled_commands',
			sequelize,
		});
	}
};