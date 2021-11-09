// Import test PORT & in-memory DB_PATH as we don't want to
// store a test database in the filesystem
import dotenv from 'dotenv';
import path from 'path';
import envPaths from '../envPaths.json';

dotenv.config({ path: path.resolve(__dirname, '..', envPaths.test) });
