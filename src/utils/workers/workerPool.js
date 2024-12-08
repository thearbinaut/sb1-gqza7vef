import { Worker } from 'worker_threads';
import { WORKER_COUNT } from '../../config/constants.js';
import logger from '../logger.js';

export class WorkerPool {
    constructor() {
        this.workers = [];
        this.taskQueue = [];
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < WORKER_COUNT; i++) {
            this.workers.push({
                worker: null,
                busy: false
            });
        }
    }

    async runTask(data) {
        return new Promise((resolve, reject) => {
            const task = { data, resolve, reject };
            this.taskQueue.push(task);
            this.processNextTask();
        });
    }

    async processNextTask() {
        const availableWorker = this.workers.find(w => !w.busy);
        const pendingTask = this.taskQueue.shift();

        if (!availableWorker || !pendingTask) return;

        try {
            availableWorker.busy = true;
            availableWorker.worker = new Worker('./src/utils/workers/addressWorker.js', {
                workerData: pendingTask.data
            });

            availableWorker.worker.on('message', (result) => {
                if (result.error) {
                    pendingTask.reject(new Error(result.error));
                } else {
                    pendingTask.resolve(result);
                }
                this.cleanupWorker(availableWorker);
            });

            availableWorker.worker.on('error', (error) => {
                pendingTask.reject(error);
                this.cleanupWorker(availableWorker);
            });

        } catch (error) {
            logger.error('Worker creation failed', { error });
            pendingTask.reject(error);
            this.cleanupWorker(availableWorker);
        }
    }

    cleanupWorker(workerInfo) {
        if (workerInfo.worker) {
            workerInfo.worker.terminate();
            workerInfo.worker = null;
        }
        workerInfo.busy = false;
        this.processNextTask();
    }

    async terminate() {
        await Promise.all(
            this.workers
                .filter(w => w.worker)
                .map(w => w.worker.terminate())
        );
        this.workers = [];
    }
}