import { ECPairFactory } from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1';

export const ECPair = ECPairFactory(ecc);