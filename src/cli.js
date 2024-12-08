import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { AddressAnalyzer } from './core/addressAnalyzer.js';
import { KeyDeriver } from './utils/keyDeriver.js';
import logger from './utils/logger.js';

const program = new Command();
const analyzer = new AddressAnalyzer();

program
  .name('bitcoin-analyzer')
  .description('Bitcoin Address Analysis Tool')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze Bitcoin addresses')
  .option('-s, --start <number>', 'Start index', '0')
  .option('-c, --count <number>', 'Number of addresses to analyze', '1000')
  .option('-b, --batch <number>', 'Batch size', '100')
  .option('--derive-keys', 'Derive private keys for addresses', false)
  .action(async (options) => {
    const spinner = ora('Initializing analysis...').start();
    try {
      const results = await analyzer.analyzeRange(
        parseInt(options.start),
        parseInt(options.count),
        parseInt(options.batch),
        options.deriveKeys
      );
      
      spinner.succeed('Analysis complete');
      displayResults(results);
    } catch (error) {
      spinner.fail('Analysis failed');
      logger.error('Analysis error', { error });
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

program
  .command('derive-key')
  .description('Derive private key for a specific address')
  .argument('<address>', 'Bitcoin address to analyze')
  .option('--brute', 'Attempt bruteforce derivation', false)
  .option('--range <range>', 'Range for bruteforce (start-end)', '1-1000000')
  .action(async (address, options) => {
    const spinner = ora('Deriving private key...').start();
    try {
      let result;
      
      if (options.brute) {
        const [start, end] = options.range.split('-').map(Number);
        result = await KeyDeriver.bruteforceAddress(address, start, end);
      } else {
        result = await analyzer.deriveKeyForAddress(address);
      }

      spinner.succeed('Derivation complete');
      
      if (result) {
        console.log(chalk.green('\nPrivate Key Found:'));
        console.log(chalk.white(`Address: ${address}`));
        console.log(chalk.white(`Private Key (hex): ${result.privateKey}`));
        console.log(chalk.white(`WIF: ${result.wif}`));
        console.log(chalk.white(`Public Key: ${result.publicKey}`));
        if (result.path) {
          console.log(chalk.white(`Derivation Path: ${result.path}`));
        }
        if (result.method) {
          console.log(chalk.white(`Method: ${result.method}`));
        }
      } else {
        console.log(chalk.yellow('\nNo private key found for this address'));
      }
    } catch (error) {
      spinner.fail('Derivation failed');
      logger.error('Key derivation error', { error });
      console.error(chalk.red(`Error: ${error.message}`));
    }
  });

function displayResults(results) {
  console.log(chalk.blue('\nAnalysis Results:'));
  
  results.forEach((result, index) => {
    console.log(chalk.white(`\n[${index + 1}] Address: ${result.address}`));
    console.log(chalk.gray(`    Path: ${result.path}`));
    console.log(chalk.gray(`    Balance: ${result.balance} satoshis`));
    console.log(chalk.gray(`    Transactions: ${result.transactions || 0}`));
    
    if (result.privateKey) {
      console.log(chalk.yellow(`    Private Key (hex): ${result.privateKey}`));
      console.log(chalk.yellow(`    WIF: ${result.wif}`));
    }
    
    if (result.balance > 0) {
      console.log(chalk.green(`    Status: Active`));
    }
  });

  const totalBalance = results.reduce((sum, r) => sum + (r.balance || 0), 0);
  const activeAddresses = results.filter(r => r.balance > 0).length;

  console.log(chalk.cyan('\nSummary:'));
  console.log(chalk.white(`Total Addresses Analyzed: ${results.length}`));
  console.log(chalk.white(`Active Addresses: ${activeAddresses}`));
  console.log(chalk.white(`Total Balance: ${totalBalance} satoshis`));
}

program.parse();