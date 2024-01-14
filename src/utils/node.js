import childProcess from 'child_process';

if (typeof Bun === 'undefined') {
    const child = childProcess.spawn(`npx bun ${process.argv[2]}`, { stdio: 'inherit', shell: true });

    child.on('close', (code) => {
        process.exit(0);
    });
}