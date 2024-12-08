import * as tf from '@tensorflow/tfjs';
import { Matrix } from 'ml-matrix';
import logger from '../utils/logger.js';

export class PatternAnalyzer {
    constructor() {
        this.model = null;
        this.initialized = false;
        this.initializeModel();
    }

    async initializeModel() {
        try {
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({ units: 64, activation: 'relu', inputShape: [32] }),
                    tf.layers.dropout({ rate: 0.2 }),
                    tf.layers.dense({ units: 32, activation: 'relu' }),
                    tf.layers.dense({ units: 1, activation: 'sigmoid' })
                ]
            });

            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            this.initialized = true;
            logger.info('Pattern analysis model initialized');
        } catch (error) {
            logger.error('Failed to initialize pattern analysis model', { error });
            throw error;
        }
    }

    async analyzeAddresses(addresses) {
        if (!this.initialized) {
            await this.initializeModel();
        }

        try {
            return await Promise.all(addresses.map(async (address) => {
                const features = this.extractFeatures(address);
                const confidence = await this.predictConfidence(features);
                return {
                    ...address,
                    confidence,
                    isPromising: confidence > 0.7
                };
            }));
        } catch (error) {
            logger.error('Address analysis failed', { error });
            return addresses.map(addr => ({ ...addr, confidence: 0, isPromising: false }));
        }
    }

    extractFeatures(address) {
        const features = [];
        
        // Balance features
        features.push(address.balance > 0 ? 1 : 0);
        features.push(Math.log1p(address.balance));
        
        // Transaction features
        features.push(address.transactions || 0);
        
        // Address pattern features
        const addressBytes = Buffer.from(address.address);
        const distribution = new Array(29).fill(0); // Simplified distribution
        addressBytes.forEach(byte => {
            distribution[byte % 29]++;
        });
        features.push(...distribution);

        return features;
    }

    async predictConfidence(features) {
        const tensorData = tf.tensor2d([features], [1, features.length]);
        try {
            const prediction = await this.model.predict(tensorData);
            const confidence = await prediction.data();
            return confidence[0];
        } finally {
            tensorData.dispose();
        }
    }

    async cleanup() {
        if (this.model) {
            this.model.dispose();
        }
    }
}