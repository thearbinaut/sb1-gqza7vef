import bip39 from 'bip39';
import logger from '../logger.js';

export class MnemonicValidator {
    static validateFormat(mnemonic) {
        if (!mnemonic || typeof mnemonic !== 'string') {
            throw new Error('Mnemonic must be a non-empty string');
        }

        const words = mnemonic.trim().split(/\s+/);
        if (![12, 15, 18, 21, 24].includes(words.length)) {
            throw new Error('Invalid mnemonic length');
        }

        return words.join(' ');
    }

    static async validate(mnemonic) {
        const normalizedMnemonic = this.validateFormat(mnemonic);
        
        if (!bip39.validateMnemonic(normalizedMnemonic)) {
            logger.error('Invalid mnemonic provided');
            throw new Error('Invalid mnemonic phrase');
        }

        return normalizedMnemonic;
    }
}