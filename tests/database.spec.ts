import moment from 'moment';

import * as db from '../src/database';
import { isNewerThan, randIntFromInterval } from '../src/utils';
import testData from '../src/test_data.json';

// Resets database to contents of testData before each test suite
const resetDatabase = async () => {
	await db.migrateRollback();
	await db.migrateLatest();
	await db.seedRun();
};

beforeEach(async () => {
	await resetDatabase();
});

afterAll(async () => {
	await db.destroy();
});

describe('getCurrentPlayers', () => {
	it('returns a list of currently playing players', async () => {
		// Ignores players that are not playing, i.e. `is_playing` === false
		const expected = testData.players
			.filter((player) => player.is_playing)
			.map(({ handle }) => ({ handle }));
		expect(await db.getCurrentPlayers()).toMatchObject(expected);
	});
});

describe('getPlayer', () => {
	it('gets details for an existing player', async () => {
		const player = testData.players[0];
		expect(await db.getPlayer(player.handle)).toMatchObject(player);
	});

	it('returns undefined if player does not exist', async () => {
		expect(await db.getPlayer('britney-spears')).toBe(undefined);
	});
});

describe('addOrUpdatePlayer', () => {
	it("inserts a database entry if player doesn't exist", async () => {
		const newPlayer = { handle: 'britney-spears' };
		// Call method
		await db.addOrUpdatePlayer(newPlayer);
		// Verify entry was created
		expect(
			await db.Players().select(['handle', 'is_playing']).where(newPlayer),
		).toMatchObject([{ ...newPlayer, is_playing: 1 }]); // sqlite3 boolean types are stored as 1/0
	});

	it("updates player's is_playing status if handle already exists", async () => {
		// Extract 2 players, one playing and one not, from test JSON file
		const notPlaying = testData.players.filter(
			({ is_playing }) => !is_playing,
		)[0];
		const playing = testData.players.filter(({ is_playing }) => is_playing)[0];

		// Consistency check between testData json and database
		expect(
			await db.Players().select('handle').where({ handle: notPlaying.handle }),
		).toMatchObject([{ handle: notPlaying.handle }]);
		expect(
			await db.Players().select('handle').where({ handle: playing.handle }),
		).toMatchObject([{ handle: playing.handle }]);

		// Should by default set is_playing to true if not passed is_playing as param
		await db.addOrUpdatePlayer({ handle: notPlaying.handle });
		expect(
			await db
				.Players()
				.select('is_playing')
				.where({ handle: notPlaying.handle }),
		).toMatchObject([{ is_playing: 1 }]); // sqlite3 boolean types are stored as 1/0

		// Must explicitly set is_playing to false to update is_playing for handle
		await db.addOrUpdatePlayer({ handle: playing.handle, is_playing: false });
		expect(
			await db.Players().select('is_playing').where({ handle: playing.handle }),
		).toMatchObject([{ is_playing: 0 }]);
	});
});

describe('deletePlayer', () => {
	it('deletes a player that exists in the players table', async () => {
		const toBeDeleted = testData.players[0].handle;
		await db.deletePlayer(toBeDeleted);

		// Should not exist in players table after deletion
		expect(await db.Players().where({ handle: toBeDeleted })).toHaveLength(0);
	});

	it('should not error when trying to delete a player not in the db', async () => {
		const doesNotExist = 'britney-spears';
		await db.deletePlayer(doesNotExist);

		// Should not exist. Test should also not throw since db.deletePlayer should handle
		// the case of trying to delete a nonexistent player.
		expect(await db.Players().where({ handle: doesNotExist })).toHaveLength(0);
	});
});

const currentQuestion = {
	question: "What's up?",
	hint: null,
	last_asked: moment().utc().format(),
};

const insertCurrentQuestion = async () => {
	await db.Questions().insert(currentQuestion);
};

describe('getCurrentQuestion', () => {
	beforeEach(async () => {
		await resetDatabase();
	});

	it('gets the current question when one exists with the newest timestamp', async () => {
		// Add a question entry with timestamp set to time of this test so that
		// it's parsed as being the "current question". The default time limit to
		// define a question as "current" is 1 week
		await insertCurrentQuestion();

		// Filter null and sort so that newer timestamps show higher in list

		expect(await db.getCurrentQuestion()).toHaveProperty(
			'question',
			currentQuestion.question,
		);
	});

	it('sets and returns a random current question when there are no questions with timestamps', async () => {
		jest.spyOn(db, 'setCurrentQuestion');

		// Set all last_asked fields to null
		await db.Questions().update({ last_asked: null });

		// No use validating at this point since a random current question should be chosen
		await db.getCurrentQuestion();

		// Verify one question is current question (i.e. has a timestamp of less than a week old)
		const questions = await db.Questions().whereNot({ last_asked: null });
		expect(questions).toHaveLength(1);
		expect(questions[0].last_asked).not.toBeNull();
		expect(isNewerThan(questions[0].last_asked!)).toBeTruthy();

		// Verify a question was set since there were no questions available
		expect(db.setCurrentQuestion).toHaveBeenCalledTimes(1);

		jest.clearAllMocks();
	});

	it('sends a default question when there are no questions in db', async () => {
		// Suppress error logging to console as we don't care about it in this test specifically
		console.error = jest.fn();

		// Delete all entries in questions table
		await db.Questions().del();

		expect(await db.getCurrentQuestion()).toMatchObject(db.defaultQuestion);

		jest.clearAllMocks();
	});
});

describe('setCurrentQuestion', () => {
	it('sets the oldest timestamped question as current question when no null-timestamp questions are present', async () => {
		const numQuestions = testData.questions.length;
		// Generate old timestamps to update questions with
		const oldTimestamps: string[] = [];
		const today = moment();
		for (let i = 0; i < numQuestions; i++) {
			oldTimestamps.push(
				today.subtract(randIntFromInterval(5, 10), 'weeks').utc().format(),
			);
		}
		// Sort from oldest to newest
		oldTimestamps.sort((a, b) => (moment(a).isBefore(b) ? -1 : 1));
		const oldest = oldTimestamps[0];

		// `id` here corresponds to the ids of the questions to be updated
		for (let id = 1; id <= oldTimestamps.length; id++) {
			await db
				.Questions()
				.where({ id })
				.update({ last_asked: oldTimestamps[id - 1] });
		}

		// Verify all timestamps were updated
		await (await db.Questions().select())
			.map((q) => q.last_asked)
			.forEach((timestamp) => expect(oldTimestamps).toContain(timestamp!));

		// Set question -- this should update the last_asked of the oldest
		// question to a newer timestamp (i.e. ask the question again)
		await db.setCurrentQuestion();

		// Get question timestamps, newest first
		const questionTimesDesc = await (
			await db.Questions().select('last_asked').orderBy('last_asked', 'desc')
		).map((entry) => entry.last_asked);

		// Newest timestamp should not be in oldTimestamps
		expect(oldTimestamps).not.toContain(questionTimesDesc[0]!);
		// Oldest timestamp should not be in questionTimesDesc
		expect(questionTimesDesc).not.toContain(oldest);
	});
});

describe('getAnswersForPlayer', () => {
	it('gets all answers for a player ordered by date answered', async () => {
		const answersForHermione = await db.getAnswersForPlayer('ewatson');
		const answerRefDesc = testData.answers
			.filter((ans) => ans.player_id === 2)
			.sort((a, b) =>
				moment(a.date_answered).isBefore(b.date_answered) ? 1 : -1,
			);
		answersForHermione.forEach((obj, idx) => {
			expect(obj.answer).toBe(answerRefDesc[idx].answer);
			expect(obj.date_answered).toBe(answerRefDesc[idx].date_answered);
		});
	});
});

describe('setOrUpdateAnswerForPlayer', () => {
	let curQuestionId = 0;
	beforeEach(async () => {
		// Insert a question entry so the test knows what the current question is
		await insertCurrentQuestion();
		curQuestionId = (
			await db
				.Questions()
				.select('id')
				.where({ question: currentQuestion.question })
		)[0].id;
	});

    afterEach(async () => {
		await resetDatabase();
	});

    const getAnswersCount = async () => (await db.Answers().count())[0]['count(*)'];

	it('updates player answer if one exists for the current week', async () => {
		// Add an answer for handle `obamaout` to the current week's question
		await db
			.Answers()
			.insert({
				player_id: 3, // corresponds to `obamaout`
				question_id: curQuestionId,
				answer: 'Another test',
				votes: 0,
				date_answered: moment().utc().format(),
			})

        const answerId = (await db.Answers().where({ answer: 'Another test' }).select('id'))[0].id;

        // Verify number of answers is one more than in test_data.json
        let numAnswers = await getAnswersCount();
        expect(numAnswers).toBe(testData.answers.length + 1);

        // Update answer entry for current question
        await db.setOrUpdateAnswerForPlayer({ handle: 'obamaout', answer: 'Yet another test' });

        // Verify number of answers has not changed
        numAnswers = await getAnswersCount();
        expect(numAnswers).toBe(testData.answers.length + 1);

        // Verify answer was updated in the correct entr
        expect((await db.Answers().where({ answer: 'Yet another test' }).select('id'))[0].id).toBe(answerId);
	});

	it('adds a new answer if one does not exist for current week', async () => {
        // Verify starting answer length
        let numAnswers = await getAnswersCount();
        expect(numAnswers).toBe(testData.answers.length);

        // No answers exist for newest question which was set in beforeEach hook, so simply insert a new answer entry
        await db.setOrUpdateAnswerForPlayer({ handle: 'ewatson', answer: 'test' });
        numAnswers = await getAnswersCount();
        expect(numAnswers).toBe(testData.answers.length + 1);

        // Verify for some reason that newest answer was inserted as a new entry with the expected data
        // `ewatson` has player_id == 2
        expect((await db.Answers().where({ answer: 'test', player_id: 2 }).select('id'))[0].id).toBe(testData.answers.length + 1);
    });
});
