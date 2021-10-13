import Knex from 'knex';
import path from 'path';

import { IPlayers, IQuestions, IAnswers } from './types';
import { NotFoundError, InternalInconsistencyError } from './errors';
import { randIntFromInterval, toTimestamp, isNewerThan } from './utils';

const knex = Knex({
	client: 'sqlite3',
	connection: {
		filename: process.env.DB_PATH!,
	},
	useNullAsDefault: true,
});

// By passing the interface types here, we get better autocompletion support later in the query
export const Players = () => knex<IPlayers>('players as p');
export const Questions = () => knex<IQuestions>('questions as q');
export const Answers = () => knex<IAnswers>('answers as a');

/**
 * Migration & seed methods for programmatic use during tests
 */
export const migrateLatest = () => {
	return knex.migrate.latest({
		directory: path.resolve(__dirname, 'migrations'),
	});
};

export const migrateRollback = async () => {
	return knex.migrate.rollback({
		directory: path.resolve(__dirname, 'migrations'),
	});
};

export const seedRun = async () => {
	return knex.seed.run({
		directory: path.resolve(__dirname, 'seeds'),
	});
};

/**
 * Destroys current database only if it's an in-memory database.
 */
export const destroy = async () => {
	if (process.env.DB_PATH === ':memory:') {
		return knex.destroy();
	} else {
		console.warn(`
			You probably don't want to be destroying an fs database.

			If developing locally, try 'npm run reseed' to reset the database back
			to a default state for development.

			If doing this in production, please don't.
		`);
		return Promise.resolve();
	}
};

/**
 * Player methods
 */
/**
 * Gets all players currently playing the game (`is_playing == true`)
 */
export const getCurrentPlayers = async () => {
	try {
		return await Players().select(['handle']).where({ is_playing: true });
	} catch (e) {
		console.error(`getCurrentPlayers error: ${e}`);
		throw e;
	}
};

/**
 * Get details for a player
 */
export const getPlayer = async (handle: IPlayers['handle']) => {
	try {
		const player = await Players().select().where({ handle });
		if (player && Array.isArray(player) && player.length === 1) {
			// As sqlite3 doesn't have boolean string types, convert
			// `is_playing` to a true/false boolean (instead of 1/0)
			const { is_playing } = player[0];
			return {
				id: player[0].id,
				handle: player[0].handle,
				is_playing:
					typeof is_playing === 'number' ? is_playing === 1 : is_playing,
			};
		} else if (player.length > 1) {
			throw new InternalInconsistencyError(`
				More than 1 player found with handle '${handle}'.
			`);
		}
		// If player does not exist, return undefined by default.
	} catch (e) {
		console.error(e);
		throw e;
	}
};

/**
 * If player doesn't exist, add them as a new entry.
 * If player exists (based on their handle), update their information.
 */
export const addOrUpdatePlayer = async ({
	handle,
	is_playing = true,
}: Partial<Pick<IPlayers, 'handle' | 'is_playing'>>) => {
	try {
		return await Players()
			.insert({ handle, is_playing })
			.onConflict(['handle'])
			.merge();
	} catch (e) {
		console.error(`addOrUpdatePlayer error: ${e}`);
		throw e;
	}
};

/**
 * Delete a player based on their handle - for when people leave company
 */
export const deletePlayer = async (handle: IPlayers['handle']) => {
	try {
		return await Players().del().where({ handle });
	} catch (e) {
		console.error(`deletePlayer error: ${e}`);
		throw e;
	}
};

/**
 * Question methods
 */
const getNewestQuestion = async () => {
	try {
		return await Questions()
			.select(['id', 'question', 'hint', 'last_asked'])
			.whereNot({ last_asked: null })
			.orderBy('last_asked', 'desc')
			.first();
	} catch (e) {
		console.error(`getNewestQuestion error: ${e}`);
		throw e;
	}
};

const getOldestQuestion = async () => {
	try {
		return await Questions()
			.select(['id', 'question', 'hint', 'last_asked'])
			.whereNot({ last_asked: null })
			.orderBy('last_asked', 'asc')
			.first();
	} catch (e) {
		console.error(`getOldestQuestion error: ${e}`);
		throw e;
	}
};

const getQuestionCount = async () => {
	try {
		return (await Questions().count('id')) || null;
	} catch (e) {
		console.error(`
			getQuestionCount error: ${e}

			Are there questions in the database?
		`);
	}
};

export const defaultQuestion = {
	id: 0,
	question: "What's my name?",
	hint: 'Look up',
};
/**
 * Get the current question of the week. Only returns the most recently asked one.
 */
export const getCurrentQuestion = async (): Promise<
	Pick<IQuestions, 'id' | 'question' | 'hint'>
> => {
	try {
		const numQuestions = await getQuestionCount();
		if (
			!numQuestions ||
			(Array.isArray(numQuestions) && !numQuestions.length)
		) {
			console.error(
				'There are no questions in the database, sending a default question',
			);
			return defaultQuestion;
		}
		// The current question is the question with the most recent
		// timestamp, hence it's equal to the "newest question".
		let newestQuestion = await getNewestQuestion();
		if (!newestQuestion || !isNewerThan(newestQuestion.last_asked as string)) {
			await setCurrentQuestion();
			newestQuestion = await getNewestQuestion();
		}
		// Logically the function should have thrown before now, so even if newestQuestion may be
		// undefined according to TS, it should be safe to cast it here.
		return newestQuestion as IQuestions;
	} catch (e) {
		console.error(`
			getCurrentQuestion error: ${e}

			Sending a default question.
		`);
		return defaultQuestion;
	}
};

/**
 * Select a random question to be set as the current week's question.
 */
export const setCurrentQuestion = async () => {
	let chosenQuestionId = 0;
	try {
		// If any questions where last_asked == null (i.e. has never been asked), choose a random one
		const nullQuestions = await Questions().whereNull('last_asked');
		if (nullQuestions.length) {
			const chosenIdx = randIntFromInterval(0, nullQuestions.length - 1);
			chosenQuestionId = nullQuestions[chosenIdx].id;
		} else {
			// Else set oldest question as last asked
			const oldestQuestion = await getOldestQuestion();
			if (oldestQuestion == null) {
				throw new InternalInconsistencyError(`
					Something has gone horribly wrong to reach this point
				`);
			}
			chosenQuestionId = oldestQuestion.id;
		}

		return await Questions()
			.where({ id: chosenQuestionId })
			.update({ last_asked: toTimestamp(Date.now()) });
	} catch (e) {
		console.error(`setCurrentQuestion error: ${e}`);
		throw e;
	}
};

/**
 * Answer methods
 */
export const getAnswersForPlayer = async (handle: IPlayers['handle']) => {
	try {
		const player = await getPlayer(handle);
		if (!player) {
			throw new NotFoundError(`Player with handle '${handle}' does not exist`);
		}
		return await Answers()
			.join('questions as q', 'a.question_id', 'q.id')
			.where({ player_id: player.id })
			.select('a.answer', 'a.votes', 'a.date_answered', 'q.question')
			.orderBy('a.date_answered', 'desc');
	} catch (e) {
		console.error(`getAnswersForPlayer error: ${e}`);
		throw e;
	}
};

/**
 * TODO: Handle votes
 */
export const setOrUpdateAnswerForPlayer = async ({
	handle,
	answer,
}: Pick<IPlayers, 'handle'> & Pick<IAnswers, 'answer'>) => {
	try {
		const player = await getPlayer(handle);
		if (!player) {
			throw new NotFoundError(`Player with handle '${handle}' does not exist`);
		}

		// Get question for the week
		const { id } = await getCurrentQuestion();

		// Update answer if it exists and is newer than a week old
		const answerIfExists = await Answers()
			.where({ player_id: player.id, question_id: id })
			.orderBy('date_answered', 'desc');

		if (
			answerIfExists.length &&
			isNewerThan(answerIfExists[0].date_answered, 1, 'weeks')
		) {
			return await Answers()
				.where({ id: answerIfExists[0].id })
				.update({ answer, date_answered: toTimestamp(Date.now()) });
		} else {
			// Else create new entry
			return await Answers().insert({
				player_id: player.id,
				question_id: id,
				answer,
			});
		}
	} catch (e) {
		console.error(`setAnswerForPlayer error: ${e}`);
		throw e;
	}
};
