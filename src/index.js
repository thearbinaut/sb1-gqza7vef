import { MnemonicAnalyzer } from './services/mnemonicAnalyzer.js';
import logger from './utils/logger.js';

async function main() {
    const analyzer = new MnemonicAnalyzer();
    
    try {
        process.on('SIGINT', async () => {
            logger.info('Shutting down gracefully...');
            await analyzer.cleanup();
            process.exit(0);
        });

        logger.info('Bitcoin Mnemonic Analyzer ready');
        
        // Start the interactive CLI
        const { Command } = await import('commander');
        const program = new Command();
        
        program
            .version('1.0.0')
            .command('analyze', 'Start analysis', { isDefault: true })
            .parse(process.argv);
            
    } catch (error) {
        logger.error('Fatal error', { error });
        await analyzer.cleanup();
        process.exit(1);
    }
}

main().catch(error => {
    logger.error('Unhandled error', { error });
    process.exit(1);
});