import Knex from 'knex';

import { IPlayers, IPuzzles, IAnswers, PickRename } from './types';
import { NotFoundError } from './errors';
import { randIntFromInterval, toTimestamp, isNewerThan } from './utils';

const knex = Knex({
	client: 'sqlite3',
	connection: {
		filename: process.env.DB_PATH!,
	},
	useNullAsDefault: true,
});

// By passing the interface types here, we get better autocompletion support later in the query
const Players = () => knex<IPlayers>('players as pl');
const Puzzles = () => knex<IPuzzles>('puzzles as pu');
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
const getPlayer = async (handle: IPlayers['handle']) => {
	try {
		return await Players().select().where({ handle });
	} catch (e) {
		console.error(`getPlayer error: ${e}`);
		throw e;
	}
};

/**
 * If player doesn't exist, add them as a new entry.
 * If player exists (based on their handle), update their information.
 */
export const addOrUpdatePlayer = async ({
	name,
	handle,
	is_playing = false,
}: Pick<IPlayers, 'name' | 'handle' | 'is_playing'>) => {
	try {
		return await Players()
			.insert({ name, handle, is_playing })
			.onConflict(['handle'])
			.merge();
	} catch (e) {
		console.error(`addOrUpdatePlayer error: ${e}`);
		throw e;
	}
};

/**
 * Delete a player based on their handle.
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
 * Puzzle methods
 */
/**
 * Get the current puzzle of the week. Only returns the most recently asked one.
 */
export const getCurrentPuzzle = async () => {
	try {
		return await Puzzles()
			.select(['id', 'question', 'hint'])
			.whereNot({ last_asked: null })
			.orderBy('last_asked', 'desc')
			.first();
	} catch (e) {
		console.error(`getCurrentPuzzle error: ${e}`);
		throw e;
	}
};

export const getPuzzleById = async (id: IPuzzles['id']) => {
	try {
		return await Puzzles().select({ id });
	} catch (e) {
		console.error(`getPuzzleById error: ${e}`);
		throw e;
	}
};

/**
 * Select a random puzzle to be set as the current week's puzzle.
 */
export const setCurrentPuzzle = async () => {
	try {
		const nullPuzzles = await Puzzles().whereNull('last_asked');
		if (nullPuzzles.length) {
			const chosenIdx = randIntFromInterval(0, nullPuzzles.length - 1);
			await Puzzles()
				.select({ id: nullPuzzles[chosenIdx].id })
				.update({ last_asked: toTimestamp(Date.now()) });
		} else {
		}
	} catch (e) {
		console.error(`getRandomPuzzle error: ${e}`);
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
			.join('puzzles as pu', 'a.puzzle_id', 'pu.id')
			.where({ player_id: players[0].id })
			.select('a.answer', 'a.votes', 'a.date_answered', 'pu.question')
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
	puzzleId,
	answer,
}: Pick<IPlayers, 'handle'> &
	PickRename<IPuzzles, 'id', 'puzzleId'> &
	Pick<IAnswers, 'answer'>) => {
	try {
		const players = await getPlayer(handle);
		if (!players.length) {
			throw new NotFoundError(`Player with handle '${handle}' does not exist`);
		}

		const puzzles = await getPuzzleById(puzzleId);
		if (!puzzles.length) {
			throw new NotFoundError(`Puzzle with id '${puzzleId}' does not exist`);
		}

		// Update answer if it exists and is newer than a week old
		const answerIfExists = await Answers()
			.where({ player_id: players[0].id, puzzle_id: puzzleId })
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
				puzzle_id: puzzleId,
				answer,
			});
		}
	} catch (e) {
		console.error(`setAnswerForPlayer error: ${e}`);
		throw e;
	}
};
