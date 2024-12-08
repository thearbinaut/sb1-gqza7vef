# Bitcoin Address Analyzer

A high-performance Bitcoin address analysis tool with comprehensive logging and balance checking capabilities.

## Features

- Derive and analyze multiple Bitcoin addresses
- Check balances and transaction history
- Multi-threaded processing for improved performance
- Detailed logging and error tracking
- Command-line interface with progress indicators

## Installation

```bash
npm install
```

## Usage

### Basic Analysis

Analyze a range of addresses:

```bash
npm run analyze -- -s 0 -c 1000
```

Options:
- `-s, --start`: Starting index (default: 0)
- `-c, --count`: Number of addresses to analyze (default: 1000)
- `-b, --batch`: Batch size for processing (default: 100)

### Development Mode

Run with auto-reload on changes:

```bash
npm run dev
```

### Testing

Run the test suite:

```bash
npm test
```

## Output

The tool provides detailed output including:
- Address details
- Balance information
- Transaction counts
- Summary statistics

All operations are logged to:
- Console (formatted output)
- `error.log` (error-level logs)
- `combined.log` (all logs)

## Performance

- Multi-threaded address derivation
- Batch processing of balance checks
- Caching of API responses
- Rate limiting to prevent API throttling

## Error Handling

- Comprehensive error tracking
- Automatic retries for API failures
- Detailed error logging
- Graceful degradation on failures