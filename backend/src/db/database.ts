import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || './data/repai.db';
const resolvedPath = path.resolve(process.cwd(), dbPath);

// Ensure data directory exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new DatabaseSync(resolvedPath);

// Enable WAL mode & foreign keys for safety and performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
