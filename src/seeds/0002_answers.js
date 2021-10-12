const baseData = require('./base_data.json');

// Seeds database with test data for development/testing purposes.
// This seed script is separate from players_puzzles to avoid have to specify
// insertion order to avoid foreign key errors.
exports.seed = function (knex) {
	return knex('answers')
		.del()
		.then(() => {
			knex('answers').insert(baseData.answers);
		});
};
