export const settings = {
    analysis: {
        batchSize: 100,
        maxConcurrentRequests: 10,
        defaultStartIndex: 0,
        confidenceThreshold: 0.7
    },
    cache: {
        ttl: 3600, // 1 hour
        cleanupInterval: 86400000 // 24 hours
    },
    api: {
        rateLimit: 3, // requests per second
        timeout: 10000 // 10 seconds
    },
    workers: {
        count: 4,
        taskTimeout: 30000 // 30 seconds
    }
};

export default settings;