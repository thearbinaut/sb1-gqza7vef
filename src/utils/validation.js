import bip39 from 'bip39';
import logger from './logger.js';

export class MnemonicValidator {
    static async validate(mnemonic) {
        if (!mnemonic || typeof mnemonic !== 'string') {
            throw new Error('Mnemonic must be a non-empty string');
        }

        const isValid = bip39.validateMnemonic(mnemonic);
        if (!isValid) {
            logger.error('Invalid mnemonic provided');
            throw new Error('Invalid mnemonic phrase');
        }

        return true;
    }
}