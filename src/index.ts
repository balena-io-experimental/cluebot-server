import Path from 'path';
import express from 'express';
import Mustache from 'mustache';
import fs from 'fs';

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
})();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use('/static', express.static(Path.resolve(__dirname, 'static')));

// Render answer submission page
app.get('/', async (_req, res) => {
	const template = fs.readFileSync(
		Path.join(__dirname, 'index.template'),
		'utf8',
	);
	const { question } = await db.getCurrentQuestion();
	const rendered = Mustache.render(template, { question});

	res.send(rendered);
});

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

app.post('/api/import', async (req, res) => {
	// Local path in heroku server deployment
	const { path } = req.body;

	if (typeof path !== 'string' || path[0] === '/' || !path.includes('.csv')) {
		console.log('not passed', path);
		return res.status(400).json({ error: `Expected a relative path to a .csv file, got: ${path}` });
	}

	try {
		const exists = await fs.promises.stat(Path.resolve(__dirname, path));
		if (!exists) {
			// curl --upload-file /path/to/csv https://transfer.sh/
			// https://transfer.sh/66nb8/config.yml
			// wget https://transfer.sh/66nb8/config.yml
			return res.status(400).json({ error: `File not found in current directory '${process.cwd()}'. Try transferring a .csv file first with 'curl --upload-file /path/to/file.csv https://transfer.sh', then 'wget' the returned URL from the heroku production server` });
		}

		await db.importQuestions(path);
		res.status(200).json({ message: 'Questions imported, duplicates are ignored' });
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: `Internal server error while importing .csv into database: ${e}` });
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
		let [ players, questions, answers ] = await Promise.all([
			db.Players().select(),
			db.Questions().select(),
			db.Answers().select()
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
