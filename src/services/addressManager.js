import { SeedGenerator } from '../utils/seedGenerator.js';
import { AddressDeriver } from '../utils/addressDeriver.js';
import { WorkerPool } from '../utils/workers/workerPool.js';
import logger from '../utils/logger.js';

export class AddressManager {
    constructor() {
        this.workerPool = new WorkerPool();
    }

    async deriveAddresses(mnemonic, startIndex, count) {
        try {
            const seed = await SeedGenerator.generateFromMnemonic(mnemonic);
            const addresses = await this.workerPool.runTask({
                seed,
                startIndex,
                count
            });

            return addresses;
        } catch (error) {
            logger.error('Address derivation failed', { error });
            throw error;
        }
    }

    async cleanup() {
        await this.workerPool.terminate();
    }
}