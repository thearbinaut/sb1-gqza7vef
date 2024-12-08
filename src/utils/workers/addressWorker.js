import { parentPort, workerData } from 'worker_threads';
import { AddressDeriver } from '../addressDeriver.js';

async function processAddresses() {
    try {
        const { seed, startIndex, count } = workerData;
        const addresses = await AddressDeriver.deriveAddresses(seed, startIndex, count);
        parentPort.postMessage({ addresses });
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
}

processAddresses();