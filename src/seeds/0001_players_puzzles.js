const baseData = require('./base_data.json');

// Seeds database with test data for development/testing purposes.
exports.seed = function (knex) {
	return Promise.all([knex('players').del(), knex('puzzles').del()]).then(
		() => {
			return Promise.all([
				knex('players').insert(baseData.players),
				knex('puzzles').insert(baseData.puzzles),
			]);
		},
	);
};
