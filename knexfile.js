/**
 * Only used for development purposes.
 * 
 * Run the following to set up a development database:
 * `npm i -g knex`        // Knex must be installed globally for CLI 
 * `knex migrate:latest`  // Creates or updates schemas
 * `knex seed:run`        // Seeds database with test data
 */
require('dotenv').config({ path: './.env.dev' });

module.exports = {
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true,
    migrations: {
        directory: './server/migrations'
    },
    seeds: {
        directory: process.env.SEEDS_PATH
    }
};
