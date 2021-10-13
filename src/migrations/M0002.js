// Adds tables with foreign key constraints. Comments are examples of entries
exports.up = function (knex) {
	// List of players with all questions they've completed, their answers, and votes
	// TODO: Votes are added here but implementation is a stretch goal for Hack Week
	return knex.schema.dropTableIfExists('answers').then(() => {
		return knex.schema.createTable('answers', (t) => {
			t.increments('id').primary();
			t.integer('player_id');
			t.integer('question_id');
			t.text('answer'); // It's translated into 'whale' in multiple languages, which references the Docker whale logo.
			t.integer('votes'); // 2
			t.timestamp('date_answered'); // 2021-01-03T00:00:00.000Z
			t.foreign('player_id').references('id').inTable('players').onUpdate('CASCADE').onDelete('SET NULL');
			t.foreign('question_id').references('id').inTable('questions').onUpdate('CASCADE').onDelete('SET NULL');
		});
	});
};

exports.down = function (knex) {
	return knex.schema.dropTableIfExists('answers');
};
