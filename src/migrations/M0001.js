// Add tables (without foreign keys). Comments are examples of entries
exports.up = function (knex) {
	return Promise.all([
		// List of players with their names and company handles, and whether they're playing currently
		knex.schema.createTable('players', (t) => {
			t.increments('id').primary();
			t.string('handle').unique(); // jsmith123
			t.boolean('is_playing').defaultTo(true); // true
		}),
		// List of puzzles with questions and hints
		knex.schema.createTable('questions', (t) => {
			t.increments('id').primary();
			t.text('question').notNullable(); // Why is the company named balena?
			t.text('hint'); // Think translations...
			t.timestamp('last_asked'); // 2021-01-01T00:00:00.000Z
		}),
	]);
};

exports.down = function (knex) {
	return Promise.all([
		knex.schema.dropTableIfExists('players'),
		knex.schema.dropTableIfExists('puzzles'),
	]);
};
