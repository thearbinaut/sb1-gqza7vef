export class AnalyzerError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'AnalyzerError';
        this.code = code;
        this.details = details;
    }
}

export class ValidationError extends AnalyzerError {
    constructor(message, details = {}) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export class APIError extends AnalyzerError {
    constructor(message, details = {}) {
        super(message, 'API_ERROR', details);
        this.name = 'APIError';
    }
}

export class WorkerError extends AnalyzerError {
    constructor(message, details = {}) {
        super(message, 'WORKER_ERROR', details);
        this.name = 'WorkerError';
    }
}