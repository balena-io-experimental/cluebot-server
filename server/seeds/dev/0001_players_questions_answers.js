const testData = require('../../test_data.json');

// Seeds database with test data for development/testing purposes.
exports.seed = function (knex) {
	return Promise.all([knex('players').del(), knex('questions').del()])
		.then(() =>
			Promise.all([
				knex('players').insert(testData.players),
				knex('questions').insert(testData.questions),
			]),
		)
		.then(() =>
			knex('answers')
				.del()
				.then(() => knex('answers').insert(testData.answers)),
		);
};
