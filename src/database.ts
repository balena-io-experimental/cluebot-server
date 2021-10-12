import Knex from 'knex';

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
const Players = () => knex<IPlayers>('players as p');
const Questions = () => knex<IQuestions>('questions as q');
const Answers = () => knex<IAnswers>('answers as a');

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
		return await Players().select().where({ handle });
	} catch {
		return [];
	}
};

/**
 * If player doesn't exist, add them as a new entry.
 * If player exists (based on their handle), update their information.
 */
export const addOrUpdatePlayer = async ({
	handle,
	is_playing = true,
} : Partial<Pick<IPlayers, 'handle' | 'is_playing'>>) => {
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
/**
 * Get the current question of the week. Only returns the most recently asked one.
 */
export const getCurrentQuestion = async () => {
	try {
		const curQuestion = await Questions()
			.select(['id', 'question', 'hint'])
			.whereNot({ last_asked: null })
			.orderBy('last_asked', 'desc')
			.first();

		if (!curQuestion) {
			throw new InternalInconsistencyError(`
				Expected a question for the current week, got: ${JSON.stringify(curQuestion)}.
				Are there questions in the cluebot database?
			`);
		} else {
			return curQuestion;
		}
	} catch (e) {
		console.error(`getCurrentQuestion error: ${e}`);
		throw e;
	}
};

// export const getQuestionById = async (id: IQuestions['id']) => {
// 	try {
// 		return await Questions().select({ id });
// 	} catch (e) {
// 		console.error(`getQuestionById error: ${e}`);
// 		throw e;
// 	}
// };

/**
 * Select a random question to be set as the current week's question.
 */
export const setCurrentQuestion = async () => {
	try {
		const nullQuestions = await Questions().whereNull('last_asked');
		if (nullQuestions.length) {
			const chosenIdx = randIntFromInterval(0, nullQuestions.length - 1);
			await Questions()
				.select({ id: nullQuestions[chosenIdx].id })
				.update({ last_asked: toTimestamp(Date.now()) });
		} else {
		}
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
		const players = await getPlayer(handle);
		if (!players.length) {
			throw new NotFoundError(`Player with handle '${handle}' does not exist`);
		}
		return await Answers()
			.join('questions as q', 'a.question_id', 'q.id')
			.where({ player_id: players[0].id })
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
}: 	Pick<IPlayers, 'handle'> &
	Pick<IAnswers, 'answer'>
) => {
	try {
		const players = await getPlayer(handle);
		if (!players.length) {
			throw new NotFoundError(`Player with handle '${handle}' does not exist`);
		}

		const { id } = await getCurrentQuestion();

		// Update answer if it exists and is newer than a week old
		const answerIfExists = await Answers()
			.where({ player_id: players[0].id, question_id: id })
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
				player_id: players[0].id,
				question_id: id,
				answer,
			});
		}
	} catch (e) {
		console.error(`setAnswerForPlayer error: ${e}`);
		throw e;
	}
};
