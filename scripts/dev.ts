import concurrently, { Options } from 'concurrently';
import dotenv from 'dotenv';
import path from 'path';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

import envPaths from '../envPaths.json';

dotenv.config({ path: path.resolve(__dirname, '..', envPaths.development) });

/**
 * Parse passed env vars
 * 
 * If `npm run dev` does not succeed with a passed DB option, make sure your development 
 * environment supports prepended env vars 
 * 
 * (Linux & Mac support this but not Windows without NPM's cross-env.
 * It's recommended to use WSL instead of Windows.)
 * 
 */
const validDb = ['sqlite3', 'pg'];

const defaults = {
    db: validDb[0],
    server: 1,
    client: 1
};


const usageMessage = `
Usage:
    [DB=${validDb.join('|')}] [SERVER=1|0] [CLIENT=1|0] npm run dev
    
    DB: development database to use. If 'pg' is specified, ensure the correct PostgreSQL version is installed locally
        (default: ${defaults.db})
    SERVER: Run nodemon for server development
        (default: ${defaults.server})
    CLIENT: Run webpack-dev-server for client development
        (default: ${defaults.client})
`;

const getArgsFromEnv = () => {
    const args = { ...defaults };

    // Grab raw args from env vars
    const { DB, SERVER, CLIENT }: NodeJS.ProcessEnv = process.env;
    args.db = DB || args.db;
    args.server = SERVER === undefined ? args.server : Number(SERVER);
    args.client = CLIENT === undefined ? args.client : Number(CLIENT);

    // Validate args
    if (!validDb.includes(args.db)) {
        console.error(`Expected passed DB env var to be one of ${JSON.stringify(validDb)}, got "${args.db}".\n`);
        process.exit(1);
    }
    
    if ([args.server, args.client].some((val) => Number.isNaN(val))) {
        console.error(`Expected passed SERVER / CLIENT env var to be one of [1, 0] or not set, got ${
            SERVER ? `"SERVER: ${SERVER}"` : ''
        }${
            CLIENT ? `, "CLIENT" ${CLIENT}` : ''
        }.\n`);
        process.exit(1);
    }

    return args;
}

const getConcurrentlyCmdFromArgs = (args: typeof defaults) => {
    // Generate concurrently command
    const commands = [];

    if (args.server) {
        commands.push({
            name: 'server',
            command: `nodemon --watch server -e ts server/index.ts`,
            env: { DB: args.db, NODE_ENV: 'development' }
        });
    }

    if (args.client) {
        commands.push({
            name: 'client',
            command: 'webpack serve --stats=minimal',
            env: { NODE_ENV: 'development' }
        });
    }

    // Validate generated command
    if (!commands.length) {
        console.log(usageMessage);
        process.exit(0);
    }

    return commands;
}

/**
 * Create development database for _first time only_ if DB=pg (Postgres)
 */
const errorExit = (...message: string[]) => {
    console.error('[scripts/dev.ts] [error]', ...message);
    process.exit(1);
}

const createPostgresDbIfNotExists = async () => {
    const { PG_HOST, PG_USER, PG_PASS, PG_DB } = process.env;

    // Validate Postgres env
    if (!PG_USER || !PG_PASS || !PG_DB || !PG_HOST) {
        errorExit('Invalid fields for Postgres in .env.dev file, aborting.');
    }

    const checkExists = `psql -l | grep ${PG_DB} | wc -l`;
    const createCommand = `psql postgresql://${PG_USER}:${PG_PASS}@${PG_HOST} -c 'CREATE DATABASE ${PG_DB}'`;
    const exec = promisify(execCb);

    return exec(checkExists).then(({ stdout, stderr }) => {
        if (stderr) {
            errorExit(`"${checkExists}" STDERR:`, stderr);
        }

        if (stdout.trim() === '0') {
            console.log('[scripts/dev.ts] [info] Cluebot database does not exist. Creating...')
            return exec(createCommand).then(({ stderr }) => {
                if (stderr) {
                    errorExit(`"${createCommand}" STDERR:`, stderr);
                }
            });
        }
    }).catch(err => {
        errorExit(`Error creating PG db or checking db exists: ${err.message || err}`);
    })
}

/**
 * Main process
 */
const args = getArgsFromEnv();
const command = getConcurrentlyCmdFromArgs(args);
const opts: Options = {
    killOthers: ['success', 'failure'],
    restartTries: 3
};

if (args.server && args.db === 'pg') {
    createPostgresDbIfNotExists()
        .then(() => {
            concurrently(command, opts)
        })
} else {
    concurrently(command, opts);
}
