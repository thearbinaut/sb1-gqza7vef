import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import logger from '../utils/logger.js';

export class UIManager {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async startInteractiveMode(analyzer) {
        console.clear();
        this.printWelcome();

        while (true) {
            const command = await this.prompt(chalk.green('analyzer> '));
            if (command === 'exit') break;
            await this.handleCommand(command, analyzer);
        }

        this.rl.close();
    }

    printWelcome() {
        console.log(chalk.blue.bold('\n=== Bitcoin Mnemonic Analyzer ==='));
        console.log(chalk.gray('Type "help" for commands or "exit" to quit\n'));
    }

    async handleCommand(command, analyzer) {
        const spinner = ora();
        try {
            switch (command) {
                case 'help':
                    this.showHelp();
                    break;
                case 'analyze':
                    await this.runInteractiveAnalysis(analyzer, spinner);
                    break;
                case 'status':
                    await this.showStatus(analyzer);
                    break;
                default:
                    console.log(chalk.yellow('Unknown command. Type "help" for available commands.'));
            }
        } catch (error) {
            spinner.fail('Operation failed');
            logger.error('Command execution failed', { command, error });
            console.error(chalk.red(`Error: ${error.message}`));
        }
    }

    async runInteractiveAnalysis(analyzer, spinner) {
        const mnemonic = await this.prompt('Enter mnemonic phrase: ');
        const startIndex = parseInt(await this.prompt('Start index (default: 0): ')) || 0;
        const count = parseInt(await this.prompt('Number of addresses (default: 100): ')) || 100;

        spinner.start('Analyzing mnemonic...');
        try {
            const result = await analyzer.analyzeMnemonic(mnemonic, startIndex, count);
            spinner.succeed('Analysis complete');
            this.displayResults(result);
        } catch (error) {
            spinner.fail('Analysis failed');
            throw error;
        }
    }

    displayResults(result) {
        console.log(chalk.cyan('\nAnalysis Results:'));
        result.addresses.forEach((addr, index) => {
            console.log(chalk.white(`\n[${index + 1}] ${addr.address}`));
            console.log(chalk.gray(`    Balance: ${addr.balance} satoshis`));
            console.log(chalk.gray(`    Confidence: ${(addr.confidence * 100).toFixed(2)}%`));
        });

        console.log(chalk.cyan('\nStatistics:'));
        console.log(chalk.gray(`Total Addresses: ${result.stats.totalAddresses}`));
        console.log(chalk.gray(`Active Addresses: ${result.stats.activeAddresses}`));
        console.log(chalk.gray(`Total Balance: ${result.stats.totalBalance} satoshis`));
    }

    async showStatus(analyzer) {
        const spinner = ora('Getting system status...').start();
        try {
            const status = await analyzer.getStatus();
            spinner.succeed('Status retrieved');
            
            console.log(chalk.cyan('\nSystem Status:'));
            console.log(chalk.gray(`Cache Size: ${status.cacheSize} entries`));
            console.log(chalk.gray(`Memory Usage: ${status.memoryUsage.toFixed(2)} MB`));
            console.log(chalk.gray(`Uptime: ${status.uptime} seconds`));
        } catch (error) {
            spinner.fail('Failed to get status');
            throw error;
        }
    }

    showHelp() {
        console.log(chalk.yellow('\nAvailable Commands:'));
        console.log(chalk.white('  analyze    - Start interactive mnemonic analysis'));
        console.log(chalk.white('  status     - Show system status'));
        console.log(chalk.white('  help       - Show this help message'));
        console.log(chalk.white('  exit       - Exit the application\n'));
    }

    prompt(question) {
        return new Promise(resolve => this.rl.question(question, resolve));
    }
}