import axios from 'axios';
import pLimit from 'p-limit';
import { BLOCKCHAIN_API_URL, API_RATE_LIMIT } from '../config/constants.js';
import logger from './logger.js';

export class BalanceChecker {
    constructor(cache) {
        this.cache = cache;
        this.limiter = pLimit(API_RATE_LIMIT);
    }

    async checkBalance(address) {
        try {
            // Check cache first
            const cached = await this.cache.get(address);
            if (cached) {
                return cached;
            }

            const response = await this.limiter(() => 
                axios.get(`${BLOCKCHAIN_API_URL}?active=${address}`)
            );

            const data = {
                address,
                balance: response.data[address].final_balance,
                totalReceived: response.data[address].total_received,
                totalSent: response.data[address].total_sent,
                transactions: response.data[address].n_tx
            };

            // Cache the result
            await this.cache.set(address, data);
            return data;
        } catch (error) {
            logger.error('Balance check failed', { error, address });
            throw error;
        }
    }

    async checkBalancesBatch(addresses) {
        try {
            const promises = addresses.map(address => this.checkBalance(address));
            return await Promise.all(promises);
        } catch (error) {
            logger.error('Batch balance check failed', { error });
            throw error;
        }
    }
}