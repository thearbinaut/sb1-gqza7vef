import * as bitcoin from 'bitcoinjs-lib';
import HDKey from 'hdkey';
import * as secp256k1 from 'secp256k1';
import { ECPairFactory } from 'ecpair';
import logger from './logger.js';

const ECPair = ECPairFactory(secp256k1);

export class KeyDeriver {
    static derivePrivateKey(seed, path) {
        try {
            const hdkey = HDKey.fromMasterSeed(seed);
            const childKey = hdkey.derive(path);
            const keyPair = ECPair.fromPrivateKey(childKey.privateKey);
            
            return {
                privateKey: childKey.privateKey.toString('hex'),
                wif: keyPair.toWIF(),
                publicKey: keyPair.publicKey.toString('hex'),
                path
            };
        } catch (error) {
            logger.error('Private key derivation failed', { error, path });
            throw error;
        }
    }

    static deriveFromWIF(wif) {
        try {
            const keyPair = ECPair.fromWIF(wif);
            return {
                privateKey: keyPair.privateKey.toString('hex'),
                wif,
                publicKey: keyPair.publicKey.toString('hex')
            };
        } catch (error) {
            logger.error('WIF derivation failed', { error });
            throw error;
        }
    }

    static async bruteforceAddress(address, startRange, endRange) {
        logger.info('Starting address bruteforce', { address, startRange, endRange });
        
        for (let i = startRange; i <= endRange; i++) {
            const privateKey = Buffer.alloc(32);
            privateKey.writeBigUInt64BE(BigInt(i));
            
            try {
                const keyPair = ECPair.fromPrivateKey(privateKey);
                const { address: derivedAddress } = bitcoin.payments.p2pkh({ 
                    pubkey: keyPair.publicKey 
                });

                if (derivedAddress === address) {
                    return {
                        privateKey: privateKey.toString('hex'),
                        wif: keyPair.toWIF(),
                        publicKey: keyPair.publicKey.toString('hex'),
                        method: 'bruteforce'
                    };
                }
            } catch (error) {
                continue;
            }
        }
        
        return null;
    }

    static verifyPrivateKey(privateKey, address) {
        try {
            const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
            const { address: derivedAddress } = bitcoin.payments.p2pkh({ 
                pubkey: keyPair.publicKey 
            });

            return {
                isValid: derivedAddress === address,
                derivedAddress
            };
        } catch (error) {
            logger.error('Private key verification failed', { error });
            return { isValid: false };
        }
    }
}