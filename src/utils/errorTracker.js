import logger from './logger.js';

export class ErrorTracker {
    constructor() {
        this.errors = new Map();
        this.errorPatterns = new Map();
    }

    async trackError(errorData) {
        const { analysisId, error, timestamp, context } = errorData;
        
        try {
            // Store error details
            this.errors.set(analysisId, {
                message: error.message,
                stack: error.stack,
                timestamp,
                context
            });

            // Analyze error pattern
            const pattern = this.analyzeErrorPattern(error);
            this.updateErrorPatterns(pattern);

            // Log error with context
            logger.error('Operation failed', {
                analysisId,
                error: error.message,
                context,
                pattern
            });

            // Cleanup old errors
            this.cleanupOldErrors();
        } catch (trackingError) {
            logger.error('Error tracking failed', { trackingError });
        }
    }

    analyzeErrorPattern(error) {
        const pattern = {
            type: error.name,
            message: this.normalizeErrorMessage(error.message),
            stack: this.extractKeyStackFrames(error.stack)
        };

        return pattern;
    }

    normalizeErrorMessage(message) {
        return message
            .replace(/[0-9]+/g, 'N') // Replace numbers with N
            .replace(/0x[a-fA-F0-9]+/g, 'ADDR') // Replace hex addresses
            .replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, 'STR'); // Replace strings
    }

    extractKeyStackFrames(stack) {
        if (!stack) return [];
        
        return stack
            .split('\n')
            .slice(0, 3) // Take first 3 frames
            .map(frame => this.normalizeStackFrame(frame));
    }

    normalizeStackFrame(frame) {
        return frame
            .replace(/at .+ \((.*)\)/, '$1') // Extract file path
            .replace(/:\d+:\d+/g, '') // Remove line:column
            .replace(/\/[^/]+\/node_modules\//, 'node_modules/'); // Normalize node_modules
    }

    updateErrorPatterns(pattern) {
        const key = `${pattern.type}:${pattern.message}`;
        
        if (!this.errorPatterns.has(key)) {
            this.errorPatterns.set(key, {
                count: 0,
                firstSeen: new Date(),
                lastSeen: new Date()
            });
        }

        const stats = this.errorPatterns.get(key);
        stats.count++;
        stats.lastSeen = new Date();
    }

    cleanupOldErrors() {
        const ONE_HOUR = 60 * 60 * 1000;
        const now = Date.now();

        // Cleanup errors older than 1 hour
        for (const [id, error] of this.errors) {
            if (now - error.timestamp > ONE_HOUR) {
                this.errors.delete(id);
            }
        }

        // Cleanup error patterns older than 24 hours
        const ONE_DAY = 24 * ONE_HOUR;
        for (const [pattern, stats] of this.errorPatterns) {
            if (now - stats.lastSeen > ONE_DAY) {
                this.errorPatterns.delete(pattern);
            }
        }
    }

    getErrorStats() {
        return {
            totalErrors: this.errors.size,
            patterns: Array.from(this.errorPatterns.entries()).map(([pattern, stats]) => ({
                pattern,
                ...stats
            }))
        };
    }
}