import * as tf from '@tensorflow/tfjs-node';
import { Matrix } from 'ml-matrix';
import { RandomForestClassifier } from 'ml-random-forest';
import logger from '../utils/logger.js';
import { MODEL_SAVE_PATH, TRAINING_BATCH_SIZE, LEARNING_RATE } from '../config/constants.js';

export class PatternLearner {
    constructor() {
        this.patterns = new Map();
        this.model = null;
        this.initialized = false;
        this.initializeModel();
    }

    async initializeModel() {
        try {
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({ units: 128, activation: 'relu', inputShape: [256] }),
                    tf.layers.dropout({ rate: 0.3 }),
                    tf.layers.dense({ units: 64, activation: 'relu' }),
                    tf.layers.dense({ units: 32, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });

            this.model.compile({
                optimizer: tf.train.adam(LEARNING_RATE),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            this.initialized = true;
            logger.info('Pattern learning model initialized');
        } catch (error) {
            logger.error('Failed to initialize pattern learning model', { error });
            throw error;
        }
    }

    async learnFromAddressPattern(address, balance, transactions) {
        if (!this.initialized) {
            await this.initializeModel();
        }

        try {
            const features = this.extractFeatures(address, balance, transactions);
            const pattern = this.createPattern(features);
            
            await this.updateModel(pattern);
            this.storePattern(address, pattern);
            
            logger.debug('Pattern learned and stored', { address });
            return pattern;
        } catch (error) {
            logger.error('Failed to learn pattern', { error, address });
            throw error;
        }
    }

    extractFeatures(address, balance, transactions) {
        const features = [];
        
        // Extract numerical patterns from address
        features.push(...this.extractAddressFeatures(address));
        
        // Balance patterns
        features.push(balance > 0 ? 1 : 0);
        features.push(Math.log1p(balance));
        
        // Transaction patterns
        features.push(transactions.length);
        features.push(this.calculateTransactionEntropy(transactions));
        
        return features;
    }

    extractAddressFeatures(address) {
        const features = [];
        const bytes = Buffer.from(address);
        
        // Calculate distribution of bytes
        const distribution = new Array(256).fill(0);
        bytes.forEach(byte => distribution[byte]++);
        
        // Normalize distribution
        const sum = distribution.reduce((a, b) => a + b, 0);
        return distribution.map(count => count / sum);
    }

    calculateTransactionEntropy(transactions) {
        if (!transactions.length) return 0;
        
        const values = transactions.map(tx => tx.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const probabilities = values.map(v => v / sum);
        
        return -probabilities.reduce((entropy, p) => {
            return entropy + (p === 0 ? 0 : p * Math.log2(p));
        }, 0);
    }

    async updateModel(pattern) {
        const tensorData = tf.tensor2d([pattern], [1, pattern.length]);
        
        try {
            await this.model.fit(tensorData, tf.tensor2d([[1]], [1, 1]), {
                epochs: 1,
                batchSize: TRAINING_BATCH_SIZE,
                verbose: 0
            });
        } finally {
            tensorData.dispose();
        }
    }

    storePattern(address, pattern) {
        this.patterns.set(address, {
            pattern,
            timestamp: Date.now()
        });
        
        // Cleanup old patterns if needed
        if (this.patterns.size > MAX_PATTERNS_TO_STORE) {
            const oldest = [...this.patterns.entries()]
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.patterns.delete(oldest);
        }
    }

    async predictSimilarity(newPattern) {
        if (!this.initialized || !this.model) {
            throw new Error('Model not initialized');
        }

        const tensorData = tf.tensor2d([newPattern], [1, newPattern.length]);
        try {
            const prediction = await this.model.predict(tensorData);
            const similarity = await prediction.data();
            return similarity[0];
        } finally {
            tensorData.dispose();
        }
    }

    async saveModel() {
        try {
            await this.model.save(`file://${MODEL_SAVE_PATH}`);
            logger.info('Model saved successfully');
        } catch (error) {
            logger.error('Failed to save model', { error });
            throw error;
        }
    }

    async loadModel() {
        try {
            this.model = await tf.loadLayersModel(`file://${MODEL_SAVE_PATH}/model.json`);
            this.initialized = true;
            logger.info('Model loaded successfully');
        } catch (error) {
            logger.error('Failed to load model', { error });
            throw error;
        }
    }
}