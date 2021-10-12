import path from 'path';
import express from 'express';
import Mustache from 'mustache';
import fs from 'fs';

(() => {
	if (!process.env.DB_PATH || typeof process.env.DB_PATH !== 'string') {
		console.error(`
            Invalid DB_PATH env var, expected one of: 
                - '/path/to/database.sqlite3'
                - ':memory:'
            Received '${process.env.DB_PATH}'
        `);
		process.exit(1);
	}
})();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));

app.get('/question/:id', (_req, res) => {
	const template = fs.readFileSync(path.join(__dirname, 'index.template'), 'utf8');
	var rendered = Mustache.render(template, { question: 'TEST QUESTION' });

	res.send(rendered);
});

app.listen(PORT, () => {
	console.log(`Cluebot starting on port ${PORT}`);
});
