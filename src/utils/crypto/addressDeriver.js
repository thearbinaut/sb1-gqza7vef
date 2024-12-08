import * as bitcoin from 'bitcoinjs-lib';
import HDKey from 'hdkey';
import { ECPair } from './ecpair.js';
import { DEFAULT_DERIVATION_PATH } from '../../config/constants.js';
import logger from '../logger.js';

export class AddressDeriver {
    static async deriveAddress(seed, index) {
        try {
            const hdkey = HDKey.fromMasterSeed(seed);
            const path = `${DEFAULT_DERIVATION_PATH}${index}`;
            const childKey = hdkey.derive(path);
            const keyPair = ECPair.fromPrivateKey(childKey.privateKey);
            
            const { address } = bitcoin.payments.p2pkh({ 
                pubkey: keyPair.publicKey,
                network: bitcoin.networks.bitcoin
            });

            return {
                address,
                path,
                index
            };
        } catch (error) {
            logger.error('Address derivation failed', { error, index });
            throw error;
        }
    }

    static async deriveAddresses(seed, startIndex, count) {
        try {
            const addresses = [];
            for (let i = 0; i < count; i++) {
                const currentIndex = startIndex + i;
                const address = await this.deriveAddress(seed, currentIndex);
                addresses.push(address);
            }
            return addresses;
        } catch (error) {
            logger.error('Batch address derivation failed', { error });
            throw error;
        }
    }

    static async getSeed() {
        const seed = Buffer.alloc(64);
        for (let i = 0; i < 64; i++) {
            seed[i] = 0;
        }
        return seed;
    }
}