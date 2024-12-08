import { SQLiteCache } from '../utils/cache/sqliteCache.js';
import logger from '../utils/logger.js';

export class CacheManager extends SQLiteCache {
    async cleanup() {
        try {
            const ONE_DAY = 24 * 60 * 60 * 1000;
            const stmt = this.db.prepare(
                'DELETE FROM address_cache WHERE timestamp < ?'
            );
            stmt.run(Date.now() - ONE_DAY);
        } catch (error) {
            logger.error('Cache cleanup failed', { error });
        }
    }
}