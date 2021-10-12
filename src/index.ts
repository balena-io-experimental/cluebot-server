import path from 'path';
import express from 'express';

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

app.get('/', (_req, res) => {
	res.send('OK');
});

app.listen(PORT, () => {
	console.log(`Cluebot starting on port ${PORT}`);
});
