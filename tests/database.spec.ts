// @ts-nocheck
import moment from 'moment';

import * as db from '../server/database';
import { randIntFromInterval } from '../server/utils';
import testData from '../server/test_data.json';

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
		expect(await db.getCurrentPlayers()).toMatchObject(testData.players);
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

describe('addPlayer', () => {
	it("inserts a database entry if player doesn't exist", async () => {
		const newPlayer = { handle: 'britney-spears' };
		// Call method
		await db.addPlayer(newPlayer);
		// Verify entry was created
		expect(
			await db.Players().select(['handle']).where(newPlayer),
		).toMatchObject([newPlayer]);
	});

	it('returns silently if player already exists', async () => {
		const newPlayer = { handle: 'britney-spears' };
		// Insert first time, verify insertion success
		await db.addPlayer(newPlayer);
		expect(
			await db.Players().select(['handle']).where(newPlayer),
		).toMatchObject([newPlayer]);

		// Insert second time, verify no new entry created
		await db.addPlayer(newPlayer);
		expect(
			await db.Players().select(['handle']).where(newPlayer),
		).toMatchObject([newPlayer]);
	})
});

const currentQuestion = {
	question: "What's up?",
	hint: null,
	last_asked: moment().utc().format(),
};

const insertCurrentQuestion = async () => {
	await db.Questions().insert(currentQuestion);
};

// TODO: this test is based on the old, pre-Google Sheets implementation. Should 
// update with test-only Google Sheets
describe.skip('getCurrentQuestion', () => {
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

// TODO: this test is based on the old, pre-Google Sheets implementation. Should 
// update with test-only Google Sheets
describe.skip('setCurrentQuestion', () => {
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

// TODO: this test is based on the old, pre-Google Sheets implementation. Should 
// update with test-only Google Sheets
describe.skip('getAnswersForPlayer', () => {
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

// TODO: this test is based on the old, pre-Google Sheets implementation. Should 
// update with test-only Google Sheets
describe.skip('setOrUpdateAnswerForPlayer', () => {
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

	const getAnswersCount = async () =>
		(await db.Answers().count())[0]['count(*)'];

	it('updates player answer if one exists for the current week', async () => {
		// Add an answer for handle `obamaout` to the current week's question
		await db.Answers().insert({
			player_id: 3, // corresponds to `obamaout`
			question_id: curQuestionId,
			answer: 'Another test',
			votes: 0,
			date_answered: moment().utc().format(),
		});

		const answerId = (
			await db.Answers().where({ answer: 'Another test' }).select('id')
		)[0].id;

		// Verify number of answers is one more than in test_data.json
		let numAnswers = await getAnswersCount();
		expect(numAnswers).toBe(testData.answers.length + 1);

		// Update answer entry for current question
		await db.setOrUpdateAnswerForPlayer({
			handle: 'obamaout',
			answer: 'Yet another test',
		});

		// Verify number of answers has not changed
		numAnswers = await getAnswersCount();
		expect(numAnswers).toBe(testData.answers.length + 1);

		// Verify answer was updated in the correct entr
		expect(
			(await db.Answers().where({ answer: 'Yet another test' }).select('id'))[0]
				.id,
		).toBe(answerId);
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
		expect(
			(
				await db.Answers().where({ answer: 'test', player_id: 2 }).select('id')
			)[0].id,
		).toBe(testData.answers.length + 1);
	});
});
