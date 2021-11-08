import Knex from 'knex';
import path from 'path';
import moment from 'moment';
import { google } from 'googleapis';

import { IPlayers, IQuestions, IAnswers } from './types';
import { NotFoundError, InternalInconsistencyError } from './errors';
import { toTimestamp } from './utils';

import knexfile from '../knexfile';
// @ts-ignore
const knex = Knex(knexfile[process.env.NODE_ENV]);

// By passing the interface types here, we get better autocompletion support later in the query
export const Players = () => knex<IPlayers>('players');
export const Answers = () => knex<IAnswers>('answers');

const SPREADSHEET_ID = '1hsuIel8SBhl8Bc3Q3qBNgg9_QlsPxFGDoT-ybMq2Bvo';
const sheets = google.sheets('v4');
const authOptions: any = {
	scopes: ['https://www.googleapis.com/auth/spreadsheets'],
};
if (process.env.NODE_ENV === 'development') {
	authOptions.keyFilename = path.resolve(__dirname, '..', 'google-credentials.json');
};
const auth = new google.auth.GoogleAuth(authOptions);

/**
 * Migration & seed methods for programmatic use during tests
 */
export const migrateLatest = () => {
	return knex.migrate.latest();
};

export const migrateRollback = async () => {
	return knex.migrate.rollback();
};

export const seedRun = async () => {
	return knex.seed.run();
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
		return await Players().select(['id', 'handle']);
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

export const defaultQuestion = {
	id: 0,
	question: "What's my name?",
	hint: 'Look up',
};

/**
 * Get the current question of the week. Only returns the most recently asked one.
 */
// TODO: Move this to its own `sheets` module and maybe break it down to a couple of functions
export const getCurrentQuestion = async (
	newQuestion: boolean = false,
): Promise<Pick<IQuestions, 'id' | 'question' | 'hint'>> => {
	// Acquire an auth client, and bind it to all future calls
	const authClient = await auth.getClient();
	google.options({ auth: authClient });

	const getPayload = {
		spreadsheetId: SPREADSHEET_ID,
		range: 'A2:C',
	};
	let getResponse = null;

	try {
		getResponse = await sheets.spreadsheets.values.get(getPayload);
	} catch (e) {
		console.error(`
			Error getting current question: ${e}

			Sending a default question.
		`);
		return defaultQuestion;
	}

	const rows: string[][] = getResponse.data.values as string[][];
	const questions = rows.map((row: string[], index: number) => {
		return {
			id: index,
			question: row[0],
			hint: row[1],
			last_asked: row[2],
		};
	});

	// Get last asked question
	let question = questions
		.filter((q) => q.last_asked)
		.reduce(
			(previousValue, currentValue) =>
				moment(previousValue.last_asked, 'DD/MM/YYYY').isAfter(
					moment(currentValue.last_asked, 'DD/MM/YYYY'),
				)
					? previousValue
					: currentValue,
			questions[0],
		);

	// If we want a new question, get the next one in the (ordered) array and update
	// its last_asked cell in the sheet
	if (newQuestion) {
		question = questions[question.id + 1];

		const setPayload = {
			spreadsheetId: SPREADSHEET_ID,
			// Range contains the row number, so we compensate for the title and 0-based index of our array
			range: `C${question.id + 2}:C${question.id + 2}`,
			valueInputOption: 'USER_ENTERED',
			auth: authClient,
			requestBody: {
				values: [[moment().format('DD/MM/YYYY')]],
			},
		};

		try {
			await sheets.spreadsheets.values.update(setPayload);
		} catch (e) {
			console.error(`
		Error setting current question: ${e}
		
		Sending a default question.
		`);
			return defaultQuestion;
		}
	}

	return question;
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

export const getAnswersForCurrentQuestion = async () => {
	try {
		const curQuestion = await getCurrentQuestion();
		const curAnswers = await Answers()
			.join('players as p', 'a.player_id', 'p.id')
			.select('a.answer', 'a.votes', 'a.date_answered', 'p.handle')
			.where({ question_id: curQuestion.id })
			.orderBy('a.date_answered', 'desc');
		return { question: curQuestion, answers: curAnswers };
	} catch (e) {
		console.error(`getAnswersForCurrentQuestion error: ${e}`);
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
		let player = await getPlayer(handle);
		if (!player) {
			await addOrUpdatePlayer({ handle });
			player = await getPlayer(handle);
		}

		// Get question for the week
		const { id } = await getCurrentQuestion();

		// Update answer if it exists and is newer than a week old
		const answerIfExists = await Answers()
			.where({ player_id: player!.id, question_id: id })
			.orderBy('date_answered', 'desc');

		if (answerIfExists.length) {
			return await Answers()
				.where({ id: answerIfExists[0].id })
				.update({ answer, date_answered: toTimestamp(Date.now()) });
		} else {
			// Else create new entry
			return await Answers().insert({
				player_id: player!.id,
				question_id: id,
				answer,
				date_answered: toTimestamp(Date.now()),
			});
		}
	} catch (e) {
		console.error(`setAnswerForPlayer error: ${e}`);
		throw e;
	}
};
