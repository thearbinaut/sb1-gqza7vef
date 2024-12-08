import { MnemonicValidator } from '../utils/validation.js';
import { SeedGenerator } from '../utils/seedGenerator.js';
import { AddressDeriver } from '../utils/addressDeriver.js';
import { BalanceChecker } from '../utils/balanceChecker.js';
import { WorkerPool } from '../utils/workers/workerPool.js';
import { SQLiteCache } from '../utils/cache/sqliteCache.js';
import { PatternLearner } from '../ai/patternLearner.js';
import { ErrorTracker } from '../utils/errorTracker.js';
import logger from '../utils/logger.js';
import { DEFAULT_BATCH_SIZE, MAX_CONCURRENT_REQUESTS } from '../config/constants.js';
import readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { performance } from 'perf_hooks';

export class MnemonicAnalyzer {
    constructor() {
        this.workerPool = new WorkerPool();
        this.cache = new SQLiteCache();
        this.balanceChecker = new BalanceChecker(this.cache);
        this.patternLearner = new PatternLearner();
        this.errorTracker = new ErrorTracker();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.performanceMetrics = new Map();
        logger.info('MnemonicAnalyzer initialized with all components');
    }

    async startCLI() {
        console.clear();
        this.printWelcome();
        await this.mainMenu();
    }

    printWelcome() {
        console.log(chalk.blue.bold('\n=== Bitcoin Mnemonic Analyzer ==='));
        console.log(chalk.gray('Type "help" for commands or "exit" to quit\n'));
    }

    async mainMenu() {
        while (true) {
            const command = await this.prompt(chalk.green('analyzer> '));
            await this.processCommand(command.trim().toLowerCase());
        }
    }

    async processCommand(command) {
        const startTime = performance.now();
        try {
            switch (command) {
                case 'help':
                    this.showHelp();
                    break;
                case 'exit':
                    await this.cleanup();
                    process.exit(0);
                    break;
                case 'status':
                    await this.showStatus();
                    break;
                case 'analyze':
                    await this.interactiveAnalysis();
                    break;
                case 'performance':
                    this.showPerformanceMetrics();
                    break;
                case 'clear':
                    console.clear();
                    this.printWelcome();
                    break;
                default:
                    await this.handleNaturalLanguage(command);
            }
        } catch (error) {
            console.log(chalk.red(`Error: ${error.message}`));
            logger.error('Command execution failed', { command, error });
        } finally {
            this.updatePerformanceMetrics(command, performance.now() - startTime);
        }
    }

    showHelp() {
        console.log(chalk.yellow('\nAvailable Commands:'));
        console.log(chalk.white('  analyze    - Start interactive mnemonic analysis'));
        console.log(chalk.white('  status     - Show system status and cache info'));
        console.log(chalk.white('  performance- Show performance metrics'));
        console.log(chalk.white('  clear      - Clear the screen'));
        console.log(chalk.white('  help       - Show this help message'));
        console.log(chalk.white('  exit       - Exit the application\n'));
    }

    async showStatus() {
        const spinner = ora('Gathering system status...').start();
        try {
            const status = {
                cacheSize: await this.cache.getSize(),
                activeWorkers: this.workerPool.getActiveCount(),
                errorStats: this.errorTracker.getErrorStats(),
                aiModelStatus: await this.patternLearner.getStatus()
            };

            spinner.succeed('System status retrieved');
            console.log(chalk.cyan('\nSystem Status:'));
            console.log(chalk.white(`Cache Entries: ${status.cacheSize}`));
            console.log(chalk.white(`Active Workers: ${status.activeWorkers}`));
            console.log(chalk.white(`Total Errors: ${status.errorStats.totalErrors}`));
            console.log(chalk.white(`AI Model Status: ${status.aiModelStatus}`));
        } catch (error) {
            spinner.fail('Failed to retrieve system status');
            throw error;
        }
    }

    async interactiveAnalysis() {
        console.log(chalk.yellow('\nStarting Interactive Analysis'));
        
        const mnemonic = await this.prompt('Enter mnemonic phrase: ');
        const startIndex = parseInt(await this.prompt('Start index (default: 0): ')) || 0;
        const batchSize = parseInt(await this.prompt(`Batch size (default: ${DEFAULT_BATCH_SIZE}): `)) || DEFAULT_BATCH_SIZE;

        const spinner = ora('Analyzing mnemonic...').start();
        try {
            const result = await this.analyzeMnemonic(mnemonic, startIndex, batchSize);
            spinner.succeed('Analysis complete');
            this.displayResults(result);
        } catch (error) {
            spinner.fail('Analysis failed');
            throw error;
        }
    }

    async analyzeMnemonic(mnemonic, startIndex = 0, batchSize = DEFAULT_BATCH_SIZE) {
        const analysisId = crypto.randomUUID();
        logger.info('Starting analysis', { analysisId, startIndex, batchSize });

        try {
            await this.validateAndPrepare(mnemonic);
            const seed = await this.generateSeed(mnemonic);
            const addresses = await this.deriveAddresses(seed, startIndex, batchSize);
            const enrichedResults = await this.enrichAddressData(addresses);
            const optimizedResults = await this.applyAIOptimizations(enrichedResults);

            logger.info('Analysis completed successfully', { analysisId });
            return {
                analysisId,
                mnemonic,
                seed: seed.toString('hex'),
                results: optimizedResults
            };
        } catch (error) {
            await this.handleError(error, analysisId);
            throw error;
        }
    }

    displayResults(result) {
        console.log(chalk.cyan('\nAnalysis Results:'));
        console.log(chalk.white(`Analysis ID: ${result.analysisId}`));
        console.log(chalk.white(`Seed: ${result.seed}`));
        
        console.log(chalk.yellow('\nDerived Addresses:'));
        result.results.forEach((addr, index) => {
            console.log(chalk.white(`\n[${index + 1}] Address: ${addr.address}`));
            console.log(chalk.gray(`    Path: ${addr.path}`));
            console.log(chalk.gray(`    Balance: ${addr.balance} satoshis`));
            console.log(chalk.gray(`    Confidence: ${(addr.patternConfidence * 100).toFixed(2)}%`));
        });
    }

    async handleNaturalLanguage(input) {
        const commands = {
            'show': ['status', 'display', 'info'],
            'analyze': ['check', 'scan', 'process'],
            'help': ['guide', 'assist', 'support'],
            'clear': ['clean', 'cls', 'reset'],
            'exit': ['quit', 'bye', 'close']
        };

        const words = input.split(' ');
        for (const [command, aliases] of Object.entries(commands)) {
            if (aliases.some(alias => words.includes(alias))) {
                await this.processCommand(command);
                return;
            }
        }

        console.log(chalk.yellow("I'm not sure what you want to do. Try 'help' for available commands."));
    }

    updatePerformanceMetrics(command, duration) {
        if (!this.performanceMetrics.has(command)) {
            this.performanceMetrics.set(command, {
                count: 0,
                totalTime: 0,
                minTime: duration,
                maxTime: duration
            });
        }

        const metrics = this.performanceMetrics.get(command);
        metrics.count++;
        metrics.totalTime += duration;
        metrics.minTime = Math.min(metrics.minTime, duration);
        metrics.maxTime = Math.max(metrics.maxTime, duration);
    }

    showPerformanceMetrics() {
        console.log(chalk.cyan('\nPerformance Metrics:'));
        for (const [command, metrics] of this.performanceMetrics) {
            console.log(chalk.white(`\nCommand: ${command}`));
            console.log(chalk.gray(`  Executions: ${metrics.count}`));
            console.log(chalk.gray(`  Avg Time: ${(metrics.totalTime / metrics.count).toFixed(2)}ms`));
            console.log(chalk.gray(`  Min Time: ${metrics.minTime.toFixed(2)}ms`));
            console.log(chalk.gray(`  Max Time: ${metrics.maxTime.toFixed(2)}ms`));
        }
    }

    prompt(question) {
        return new Promise(resolve => this.rl.question(question, resolve));
    }

    async validateAndPrepare(mnemonic) {
        try {
            await MnemonicValidator.validate(mnemonic);
        } catch (error) {
            logger.error('Mnemonic validation failed', { error });
            throw new Error('Invalid mnemonic phrase');
        }
    }

    async generateSeed(mnemonic) {
        try {
            return await SeedGenerator.generateFromMnemonic(mnemonic);
        } catch (error) {
            logger.error('Seed generation failed', { error });
            throw new Error('Failed to generate seed from mnemonic');
        }
    }

    async deriveAddresses(seed, startIndex, batchSize) {
        const chunks = Math.ceil(batchSize / MAX_CONCURRENT_REQUESTS);
        const chunkSize = Math.ceil(batchSize / chunks);
        const tasks = [];

        for (let i = 0; i < chunks; i++) {
            const chunkStartIndex = startIndex + (i * chunkSize);
            const currentChunkSize = Math.min(chunkSize, batchSize - (i * chunkSize));

            tasks.push(this.workerPool.runTask({
                seed,
                startIndex: chunkStartIndex,
                count: currentChunkSize
            }));
        }

        try {
            const results = await Promise.all(tasks);
            return results.flatMap(r => r.addresses);
        } catch (error) {
            logger.error('Address derivation failed', { error });
            throw new Error('Failed to derive addresses');
        }
    }

    async enrichAddressData(addresses) {
        try {
            const balances = await this.balanceChecker.checkBalancesBatch(
                addresses.map(a => a.address)
            );

            return addresses.map((deriveInfo, idx) => ({
                ...deriveInfo,
                ...balances[idx]
            }));
        } catch (error) {
            logger.error('Address enrichment failed', { error });
            throw new Error('Failed to enrich address data');
        }
    }

    async applyAIOptimizations(results) {
        try {
            const optimizedResults = [];

            for (const result of results) {
                const pattern = await this.patternLearner.learnFromAddressPattern(
                    result.address,
                    result.balance,
                    result.transactions || []
                );

                const similarity = await this.patternLearner.predictSimilarity(pattern);
                
                optimizedResults.push({
                    ...result,
                    patternConfidence: similarity,
                    isPromising: similarity > PATTERN_SIMILARITY_THRESHOLD
                });
            }

            return optimizedResults.sort((a, b) => b.patternConfidence - a.patternConfidence);
        } catch (error) {
            logger.error('AI optimization failed', { error });
            return results;
        }
    }

    async handleError(error, analysisId) {
        await this.errorTracker.trackError({
            analysisId,
            error,
            timestamp: new Date(),
            context: {
                component: 'MnemonicAnalyzer',
                operation: error.operation || 'unknown'
            }
        });
    }

    async cleanup() {
        this.rl.close();
        await Promise.all([
            this.workerPool.terminate(),
            this.patternLearner.saveModel()
        ]);
    }
}