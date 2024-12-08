import * as bitcoin from 'bitcoinjs-lib';
import HDKey from 'hdkey';
import { DEFAULT_DERIVATION_PATH } from '../config/constants.js';
import logger from './logger.js';

export class AddressDeriver {
    static deriveAddress(hdkey, index) {
        try {
            const childKey = hdkey.derive(`${DEFAULT_DERIVATION_PATH}${index}`);
            const keyPair = bitcoin.ECPair.fromPrivateKey(childKey.privateKey);
            const { address } = bitcoin.payments.p2pkh({ 
                pubkey: keyPair.publicKey,
                network: bitcoin.networks.bitcoin
            });

            return {
                address,
                path: `${DEFAULT_DERIVATION_PATH}${index}`,
                index
            };
        } catch (error) {
            logger.error('Address derivation failed', { error, index });
            throw error;
        }
    }

    static async deriveAddresses(seed, startIndex, count) {
        try {
            const hdkey = HDKey.fromMasterSeed(seed);
            const addresses = [];

            for (let i = 0; i < count; i++) {
                const currentIndex = startIndex + i;
                addresses.push(this.deriveAddress(hdkey, currentIndex));
            }

            return addresses;
        } catch (error) {
            logger.error('Batch address derivation failed', { error });
            throw error;
        }
    }
}