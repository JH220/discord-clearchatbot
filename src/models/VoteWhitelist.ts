import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class VoteWhitelist extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			userId: {
				type: DataTypes.STRING(30),
				primaryKey: true,
			},
			modId: { type: DataTypes.STRING(30) },
		}, {
			tableName: 'vote_whitelist',
			sequelize,
		});
	}
};