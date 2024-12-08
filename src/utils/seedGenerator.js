import bip39 from 'bip39';
import logger from './logger.js';

export class SeedGenerator {
    static async generateFromMnemonic(mnemonic) {
        try {
            const seed = await bip39.mnemonicToSeed(mnemonic);
            logger.debug('Seed generated successfully');
            return seed;
        } catch (error) {
            logger.error('Failed to generate seed', { error });
            throw new Error('Seed generation failed');
        }
    }
}