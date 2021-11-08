exports.up = function (knex) {
	// .createTableIfNotExists generates a plain "CREATE TABLE IF NOT EXIST..." query 
	// which won't work correctly if there are any alter table queries generated for 
	// columns afterwards. Instead, use .hasTable => .createTable.
	return knex.schema.hasTable('players').then((exists) => {
		if (!exists) {
			return knex.schema.createTable('players',  (t) => {
				t.increments('id').primary();
				t.string('handle').unique();
			});
		}
	});
};

exports.down = function (knex) {
	if (process.env.NODE_ENV === 'production') {
		throw new Error('Not implemented');
	} else {
		return knex.schema.dropTableIfExists('players');
	}
};
