import Path from 'path';
import express from 'express';

import * as db from './database';
import { NotFoundError } from './errors';

(async () => {
	if (!process.env.DB_PATH || typeof process.env.DB_PATH !== 'string') {
		console.error(`
            Invalid DB_PATH env var, expected one of: 
                - '/path/to/database.sqlite3'
                - ':memory:'
            Received '${process.env.DB_PATH}'
        `);
		process.exit(1);
	}

	// Migrate to latest db schema
	await db.migrateLatest();

	// TODO: Remove this after using persistent DB in heroku (PostgreSQL)
	// This is only hardcoded for Hack Week but isn't viable long term
	// because sqlite3 databases are ephemeral and will reset between deployments
	await db.seedRun();
})();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use('/', express.static(Path.resolve(__dirname, '..', 'public')));
app.use(
	['/static'],
	express.static(Path.resolve(__dirname, '..', 'client', 'static')),
);
app.use(
	'/fonts',
	express.static(Path.resolve(__dirname, '..', 'client', 'fonts')),
);

app.get('/api/players', async (_req, res) => {
	try {
		const players = await db.getCurrentPlayers();
		res.status(200).json(players);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: `Internal server error: ${e}` });
	}
});

app.post('/api/answer', async (req, res) => {
	const { handle, answer } = req.body;

	if (typeof handle !== 'string') {
		return res.status(400).json({
			error: `Invalid handle in POST request. Expected a string, got: '${handle}'`,
		});
	}
	if (typeof answer !== 'string') {
		return res.status(400).json({
			error: `Invalid answer in POST request. Expected a string, got: '${answer}'`,
		});
	}

	try {
		// Upsert db entry with is_playing: true.
		// If player exists, update is_playing on their existing entry.
		// If player doesn't exist, create entry in players table with handle and is_playing.
		await db.setOrUpdateAnswerForPlayer({ handle, answer });
		res
			.status(200)
			.json({ message: `Handle '${handle}' successfully submitted an answer` });
	} catch (e) {
		if (e instanceof NotFoundError) {
			res.status(400).json({
				error: `Handle '${handle}' doesn't exist 😭. Try leaving and rejoining the flow.`,
			});
		} else {
			res.status(500).json({
				error: `Internal server error while adding or updating player entry: ${e}`,
			});
		}
	}
});

// We can use this endpoint for getting hint(s) for a question as well
app.get('/api/question', async (_req, res) => {
	try {
		const curQuestion = await db.getCurrentQuestion();
		return res.status(200).json(curQuestion);
	} catch (e) {
		console.error(e);
		res.status(500).json({
			error: `Internal server error while getting current question: ${e}`,
		});
	}
});

app.get('/api/db', async (_req, res) => {
	try {
		const [players, questions, answers] = await Promise.all([
			db.Players().select(),
			db.Questions().select(),
			db.Answers().select(),
		]);

		res.status(200).json({ players, questions, answers });
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: `Internal server error: ${e}` });
	}
});

app.get('/api/answers', async (_req, res) => {
	try {
		const questionWithAnswers = await db.getAnswersForCurrentQuestion();
		res.status(200).json(questionWithAnswers);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: `Internal server error: ${e}` });
	}
});

app.post('/api/join', async (req, res) => {
	// Validate POST req input
	const { handle } = req.body;
	if (typeof handle !== 'string') {
		return res.status(400).json({
			error: `Invalid handle in POST request. Expected a string, got: '${handle}'`,
		});
	}

	try {
		// Upsert db entry with is_playing: true.
		// If player exists, update is_playing on their existing entry.
		// If player doesn't exist, create entry in players table with handle and is_playing
		await db.addOrUpdatePlayer({ handle, is_playing: true });
		res.status(200).json({
			message: `User with handle '${handle}' successfully joined game`,
		});
	} catch (e) {
		console.error(e);
		res.status(500).json({
			error: `Internal server error while adding or updating player entry: ${e}`,
		});
	}
});

app.post('/api/leave', async (req, res) => {
	// Validate POST req input
	const { handle } = req.body;
	if (typeof handle !== 'string') {
		return res.status(400).json({
			error: `Invalid handle in POST request. Expected a string, got: '${handle}'`,
		});
	}

	// Set player to inactive status by changing the is_playing property to false.
	// The player's handle remains in the db for when they decide to join again.
	try {
		await db.addOrUpdatePlayer({ handle, is_playing: false });
		res.status(200).json({
			message: `User with handle '${handle}' successfully deleted from game`,
		});
	} catch (e) {
		console.error(e);
		res.status(500).json({
			error: `Internal server error while updating player entry: ${e}`,
		});
	}
});

app.listen(PORT, () => {
	console.log(`Cluebot starting on port ${PORT}`);
});
