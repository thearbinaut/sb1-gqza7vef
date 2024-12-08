import { AddressDeriver } from '../utils/crypto/addressDeriver.js';
import { BalanceChecker } from '../utils/balanceChecker.js';
import { KeyDeriver } from '../utils/crypto/keyDeriver.js';
import { WorkerPool } from '../utils/workers/workerPool.js';
import logger from '../utils/logger.js';

export class AddressAnalyzer {
    constructor() {
        this.workerPool = new WorkerPool();
        this.balanceChecker = new BalanceChecker();
    }

    async analyzeRange(startIndex, count, batchSize = 100, deriveKeys = false) {
        logger.info('Starting address analysis', { startIndex, count, batchSize, deriveKeys });
        
        try {
            const seed = await AddressDeriver.getSeed();
            const batches = Math.ceil(count / batchSize);
            const results = [];

            for (let i = 0; i < batches; i++) {
                const batchStart = startIndex + (i * batchSize);
                const batchCount = Math.min(batchSize, count - (i * batchSize));
                
                logger.debug(`Processing batch ${i + 1}/${batches}`, { batchStart, batchCount });
                
                const batchResults = await this.analyzeBatch(seed, batchStart, batchCount, deriveKeys);
                results.push(...batchResults);
                
                logger.debug(`Batch ${i + 1} complete`, { 
                    addressesFound: batchResults.length,
                    withBalance: batchResults.filter(r => r.balance > 0).length
                });
            }

            return results;
        } catch (error) {
            logger.error('Analysis failed', { error });
            throw error;
        }
    }

    async analyzeBatch(seed, startIndex, count, deriveKeys) {
        try {
            const addresses = await AddressDeriver.deriveAddresses(seed, startIndex, count);
            const enrichedAddresses = await this.balanceChecker.checkBalancesBatch(addresses);
            
            if (deriveKeys) {
                return await Promise.all(enrichedAddresses.map(async (addr) => {
                    const keyInfo = await this.deriveKeyForAddress(addr.address, addr.path);
                    return { ...addr, ...keyInfo };
                }));
            }
            
            return enrichedAddresses;
        } catch (error) {
            logger.error('Batch analysis failed', { error, startIndex, count });
            throw error;
        }
    }

    async deriveKeyForAddress(address, knownPath = null) {
        try {
            const seed = await AddressDeriver.getSeed();
            
            if (knownPath) {
                return KeyDeriver.derivePrivateKey(seed, knownPath);
            }
            
            // Try different derivation methods
            const methods = [
                async () => {
                    for (let i = 0; i < 1000; i++) {
                        const path = `m/44'/0'/0'/0/${i}`;
                        const keyInfo = KeyDeriver.derivePrivateKey(seed, path);
                        if (KeyDeriver.verifyPrivateKey(keyInfo.privateKey, address).isValid) {
                            return { ...keyInfo, method: 'hd-wallet' };
                        }
                    }
                    return null;
                },
                async () => KeyDeriver.bruteforceAddress(address, 1, 1000000)
            ];

            for (const method of methods) {
                const result = await method();
                if (result) return result;
            }

            return null;
        } catch (error) {
            logger.error('Key derivation failed', { error, address });
            return null;
        }
    }

    async cleanup() {
        await this.workerPool.terminate();
    }
}