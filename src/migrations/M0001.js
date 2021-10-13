// Add tables (without foreign keys). Comments are examples of entries
exports.up = function (knex) {
	const schemas = [
		{
			// List of players with their names and company handles, and whether they're playing currently
			table: 'players',
			schemaFn:  (t) => {
				t.increments('id').primary();
				t.string('handle').unique();
				t.boolean('is_playing').defaultTo(true);
			}
		},
		{
			// List of questions with questions and hints
			table: 'questions',
			schemaFn: (t) => {
				t.increments('id').primary();
				t.text('question').notNullable();
				t.text('hint');
				t.timestamp('last_asked');
			}
		}
	];

	return Promise.all(schemas.map(({ table, schemaFn }) => {
		return knex.schema.dropTableIfExists(table)
			.then(() => knex.schema.createTable(table, schemaFn));
	}));
};

exports.down = function (knex) {
	return Promise.all([
		knex.schema.dropTableIfExists('players'),
		knex.schema.dropTableIfExists('puzzles'),
	]);
};
