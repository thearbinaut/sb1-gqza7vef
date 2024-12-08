import { PatternAnalyzer } from '../ai/patternAnalyzer.js';
import { AddressManager } from '../services/addressManager.js';
import { BalanceManager } from '../services/balanceManager.js';
import { CacheManager } from '../services/cacheManager.js';
import logger from '../utils/logger.js';

export class AnalyzerCore {
    constructor() {
        this.cache = new CacheManager();
        this.addressManager = new AddressManager();
        this.balanceManager = new BalanceManager(this.cache);
        this.patternAnalyzer = new PatternAnalyzer();
    }

    async analyzeMnemonic(mnemonic, startIndex = 0, batchSize = 100) {
        try {
            const addresses = await this.addressManager.deriveAddresses(mnemonic, startIndex, batchSize);
            const enrichedAddresses = await this.balanceManager.enrichAddresses(addresses);
            const analyzedAddresses = await this.patternAnalyzer.analyzeAddresses(enrichedAddresses);
            
            return {
                addresses: analyzedAddresses,
                stats: this.calculateStats(analyzedAddresses)
            };
        } catch (error) {
            logger.error('Analysis failed', { error });
            throw error;
        }
    }

    async runBatchAnalysis(startIndex, count) {
        try {
            const batchSize = 100;
            const batches = Math.ceil(count / batchSize);
            const results = [];

            for (let i = 0; i < batches; i++) {
                const currentStart = startIndex + (i * batchSize);
                const currentCount = Math.min(batchSize, count - (i * batchSize));
                
                const batchResult = await this.analyzeBatch(currentStart, currentCount);
                results.push(...batchResult);
            }

            return results;
        } catch (error) {
            logger.error('Batch analysis failed', { error });
            throw error;
        }
    }

    calculateStats(addresses) {
        return {
            totalAddresses: addresses.length,
            totalBalance: addresses.reduce((sum, addr) => sum + addr.balance, 0),
            activeAddresses: addresses.filter(addr => addr.balance > 0).length,
            averageConfidence: addresses.reduce((sum, addr) => sum + addr.confidence, 0) / addresses.length
        };
    }

    async cleanup() {
        await Promise.all([
            this.cache.cleanup(),
            this.patternAnalyzer.cleanup()
        ]);
    }
}