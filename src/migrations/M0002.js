// Adds tables with foreign key constraints. Comments are examples of entries
exports.up = function (knex) {
	// List of players with all puzzles they've completed, their answers, and votes
	// TODO: Votes are added here but implementation is a stretch goal for Hack Week
	return knex.schema.createTable('answers', (t) => {
		t.increments('id').primary();
		t.integer('player_id');
		t.integer('puzzle_id');
		t.text('answer'); // It's translated into 'whale' in multiple languages, which references the Docker whale logo.
		t.integer('votes').unsigned(); // 2
		t.timestamp('date_answered').notNullable(); // 2021-01-03T00:00:00.000Z
		t.foreign('player_id')
			.references('players.id')
			.onUpdate('CASCADE')
			.onDelete('SET NULL');
		t.foreign('puzzle_id')
			.references('puzzles.id')
			.onUpdate('CASCADE')
			.onDelete('SET NULL');
	});
};

exports.down = function (knex) {
	return knex.schema.dropTableIfExists('answers');
};
