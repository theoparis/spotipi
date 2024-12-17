#!/usr/bin/env node

import { spawn } from 'child_process';

// Function to start the Vite dev server
function startDevServer(port = 5173) {
    const devServer = spawn('npm', ['run', 'dev', '--', `--port=${port}`], {
        stdio: 'inherit',
        shell: true
    });

    devServer.on('error', (error) => {
        console.error('Failed to start dev server:', error);
        process.exit(1);
    });
}

// Main CLI entry point
function main() {
    const args = process.argv.slice(2);

    switch (args[0]) {
        case 'start':
            // Check if a port is specified, otherwise use default
            let port = 5173;
            if (args.length > 1) {
                port = parseInt(args[1], 10);

                // Validate port number
                if (isNaN(port) || port < 1 || port > 65535) {
                    console.error(
                        'Invalid port number. Please specify a port between 1 and 65535.'
                    );
                    process.exit(1);
                }
            }

            startDevServer(port);
            break;
        default:
            console.log('Usage: spotipi start [port_number]');
            process.exit(1);
    }
}

main();
