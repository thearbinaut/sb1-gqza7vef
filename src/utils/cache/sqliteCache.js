import Database from 'better-sqlite3';
import { DB_PATH } from '../../config/constants.js';
import logger from '../logger.js';

export class SQLiteCache {
    constructor() {
        this.db = new Database(DB_PATH);
        this.initializeDatabase();
    }

    initializeDatabase() {
        try {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS address_cache (
                    address TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    timestamp INTEGER NOT NULL
                )
            `);
            logger.info('SQLite cache initialized');
        } catch (error) {
            logger.error('Failed to initialize SQLite cache', { error });
            throw error;
        }
    }

    async get(address) {
        try {
            const stmt = this.db.prepare('SELECT * FROM address_cache WHERE address = ?');
            const result = stmt.get(address);

            if (!result) return null;

            // Check if cache is expired (1 hour)
            if (Date.now() - result.timestamp > 3600000) {
                await this.delete(address);
                return null;
            }

            return JSON.parse(result.data);
        } catch (error) {
            logger.error('Cache get failed', { error, address });
            return null;
        }
    }

    async set(address, data) {
        try {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO address_cache (address, data, timestamp)
                VALUES (?, ?, ?)
            `);
            stmt.run(address, JSON.stringify(data), Date.now());
        } catch (error) {
            logger.error('Cache set failed', { error, address });
        }
    }

    async delete(address) {
        try {
            const stmt = this.db.prepare('DELETE FROM address_cache WHERE address = ?');
            stmt.run(address);
        } catch (error) {
            logger.error('Cache delete failed', { error, address });
        }
    }

    async clear() {
        try {
            this.db.exec('DELETE FROM address_cache');
        } catch (error) {
            logger.error('Cache clear failed', { error });
        }
    }
}