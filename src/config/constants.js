export const BITCOIN_NETWORK = 'bitcoin';
export const DEFAULT_DERIVATION_PATH = "m/44'/0'/0'/0/";
export const DEFAULT_BATCH_SIZE = 100;
export const MAX_CONCURRENT_REQUESTS = 10;
export const CACHE_TTL = 3600; // 1 hour
export const API_RATE_LIMIT = 3; // requests per second
export const WORKER_COUNT = 4;
export const DB_PATH = './cache/addresses.db';
export const BLOCKCHAIN_API_URL = 'https://blockchain.info/balance';
export const LOG_LEVEL = 'debug';

// AI/ML Constants
export const MODEL_SAVE_PATH = './models';
export const TRAINING_BATCH_SIZE = 32;
export const LEARNING_RATE = 0.001;
export const MAX_PATTERNS_TO_STORE = 10000;
export const PATTERN_SIMILARITY_THRESHOLD = 0.85;