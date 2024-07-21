import { Sequelize } from 'sequelize';

const { DataTypes, Model } = require('sequelize');

module.exports = class Vote extends Model {
	static init(sequelize : Sequelize) {
		return super.init({
			voteId: {
				type: DataTypes.INTEGER,
				autoIncrement: true,
				primaryKey: true,
			},
			userId: { type: DataTypes.STRING(30) },
		}, {
			tableName: 'votes',
			sequelize,
		});
	}
};