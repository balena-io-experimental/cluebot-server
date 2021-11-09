import fs from 'fs';
import path from 'path';

import envPaths from '../envPaths.json';


/**
 * Task: Setup .env files
 */
type Env = 'test' | 'development' | 'production';

interface IEnvSettings {
    [key: string]: string | number;
}

// Source of truth for different NODE_ENV values. 
// These are written into 3 .env files which are used for the appropriate node processes.
// Modify envSettings as new env vars are added/needed.
const envSettings: Record<Env, IEnvSettings> = {
    test: {
        DB_PATH: ':memory:',
        PORT: 4000
    },
    development: {
        DB_PATH: './database.sqlite3',
        PORT: 3000,
        // Devs: add your Postgres user & pass to generated .env.dev file prior to development if you 
        // wish to use Postgres. Specifying `DB=pg npm run dev` without editing .env.dev first will error.
        PG_HOST: 'localhost',
        PG_USER: '',
        PG_PASS: '',
        PG_DB: 'cluebot'
    },
    production: {
        PORT: 80,
        DB: 'pg'
    }
};

const writeEnvFile = async (env: Env) => {
    const toWrite = Object.entries(envSettings[env])
        .map(([ key, value ]) => `${key}=${value}`)
        .join('\n');
    await fs.promises.writeFile(path.resolve(__dirname, '..', envPaths[env]), toWrite);
}

const writeEnvFiles = async () => {
    for (const env in envSettings) {
        await writeEnvFile(env as Env);
    }
}

/**
 * Main process
 */

const cluebotLog = (scriptName: string, message: string, level: string = 'log') => {
    (console as any)[level](`[cluebot postinstall] [${scriptName}]: ${message}\n`);
    if (level === 'error') {
        process.exit(1);
    }
}
    
writeEnvFiles().then(() => cluebotLog('write-env-files', '.env files set up successfully.'))
    .catch((err) => cluebotLog('write-env-files', `Error setting up .env files: ${err.message || err}`, 'error'));
