const testData = require('../test_data.json');

// Seeds database with test data for development/testing purposes.
exports.seed = function (knex) {
	return knex('players').del()
		.then(() => knex('answers').del())
		.then(() => knex('players').insert(testData.players))
		.then(() => knex('answers').insert(testData.answers))
}
