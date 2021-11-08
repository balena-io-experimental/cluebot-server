import Path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import envPaths from '../envPaths.json';
// @ts-ignore
dotenv.config({ path: Path.resolve(__dirname, '..', envPaths[process.env.NODE_ENV]) });

import * as db from './database';
import { NotFoundError } from './errors';

(async () => {
	if (!process.env.DB) {
		console.error(`
			DB env var not specified, exiting.
		`);
		process.exit(1);
	}

	// Migrate to latest db schema
	await db.migrateLatest();
})();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use('/', express.static(Path.resolve(__dirname, '..', 'public')));
app.use(
	'/static',
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
	// Validate request body
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
		// If player doesn't exist, create entry in players table with handle
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
	const newQuestion = _req.query.new_question === "true";

	try {
		const curQuestion = await db.getCurrentQuestion(newQuestion);
		return res.status(200).json(curQuestion);
	} catch (e) {
		console.error(e);
		res.status(500).json({
			error: `Internal server error while getting current question: ${e}`,
		});
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

app.listen(PORT, () => {
	console.log(`Cluebot starting on port ${PORT}`);
});
