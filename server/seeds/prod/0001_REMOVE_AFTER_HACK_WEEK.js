exports.seed = function (knex) {
	return Promise.all([knex('players').del(), knex('questions').del()])
		.then(() =>
			Promise.all([
				knex('questions').insert({
					question: 'Is it ba-LEE-na or BA-leh-na or ba-LAY-na?',
					hint: 'No hints here, sowwy ( •̀ ω •́ )✧',
				}),
			]),
		)
		.then(() => knex('answers').del());
};
