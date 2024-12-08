import { BalanceChecker } from '../utils/balanceChecker.js';
import logger from '../utils/logger.js';

export class BalanceManager {
    constructor(cache) {
        this.balanceChecker = new BalanceChecker(cache);
    }

    async enrichAddresses(addresses) {
        try {
            const enrichedAddresses = await this.balanceChecker.checkBalancesBatch(addresses);
            return enrichedAddresses;
        } catch (error) {
            logger.error('Address enrichment failed', { error });
            throw error;
        }
    }
}