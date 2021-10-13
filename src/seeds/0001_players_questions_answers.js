const baseData = require('../base_data.json');

// Seeds database with test data for development/testing purposes.
exports.seed = function (knex) {
	return Promise.all([knex('players').del(), knex('questions').del()])
		.then(
			() => 
				Promise.all([
					knex('players').insert(baseData.players),
					knex('questions').insert(baseData.questions),
				])
		).then(
			() => 
				knex('answers')
					.del()
					.then(() =>
						knex('answers').insert(baseData.answers)
					)
		);
};
