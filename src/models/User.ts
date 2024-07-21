import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class User extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			userId: {
				type: DataTypes.STRING(30),
				primaryKey: true,
			},
			userName: { type: DataTypes.STRING(64) },
			userPicture: { type: DataTypes.STRING },
		}, {
			tableName: 'users',
			sequelize,
		});
	}
};