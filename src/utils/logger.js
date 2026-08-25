const path = require('path');
const fs = require('fs');
const { app, shell } = require('electron');

const MAX_LOG_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ARCHIVE_FILES = 3;

class Logger {
    constructor() {
        this.logsDir = null;
        this.logFilePath = null;
        this.crashFilePath = null;
        this.writeStream = null;
        this.initPaths();
        this.initStream();
    }

    initPaths() {
        try {
            const userData = app.getPath('userData');
            this.logsDir = path.join(userData, 'logs');
        } catch {
            this.logsDir = path.join(process.cwd(), 'logs');
        }

        try {
            if (!fs.existsSync(this.logsDir)) {
                fs.mkdirSync(this.logsDir, { recursive: true });
            }
        } catch (err) {
            console.warn('[Logger] Could not create logs directory:', err.message);
        }

        this.logFilePath = path.join(this.logsDir, 'app.log');
        this.crashFilePath = path.join(this.logsDir, 'crash.log');
    }

    rotateLogsIfNeeded() {
        try {
            if (fs.existsSync(this.logFilePath)) {
                const stats = fs.statSync(this.logFilePath);
                if (stats.size >= MAX_LOG_SIZE_BYTES) {
                    if (this.writeStream) {
                        this.writeStream.end();
                        this.writeStream = null;
                    }

                    // Rotate archive files: app.2.log -> app.3.log, app.1.log -> app.2.log, etc.
                    for (let i = MAX_ARCHIVE_FILES - 1; i >= 1; i--) {
                        const src = path.join(this.logsDir, `app.${i}.log`);
                        const dst = path.join(this.logsDir, `app.${i + 1}.log`);
                        if (fs.existsSync(src)) {
                            if (i === MAX_ARCHIVE_FILES - 1 && fs.existsSync(dst)) {
                                fs.unlinkSync(dst);
                            }
                            fs.renameSync(src, dst);
                        }
                    }

                    const firstArchive = path.join(this.logsDir, 'app.1.log');
                    fs.renameSync(this.logFilePath, firstArchive);
                }
            }
        } catch (err) {
            console.warn('[Logger] Log rotation warning:', err.message);
        }
    }

    initStream() {
        try {
            this.rotateLogsIfNeeded();
            this.writeStream = fs.createWriteStream(this.logFilePath, { flags: 'a', encoding: 'utf8' });
        } catch (err) {
            console.warn('[Logger] Error initializing write stream:', err.message);
        }
    }

    formatLog(level, context, message, meta) {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let metaStr = '';
        if (meta) {
            if (meta instanceof Error) {
                metaStr = ` | Stack: ${meta.stack || meta.message}`;
            } else if (typeof meta === 'object') {
                try {
                    metaStr = ` | Meta: ${JSON.stringify(meta)}`;
                } catch {
                    metaStr = ` | Meta: [Unserializable Object]`;
                }
            } else {
                metaStr = ` | ${meta}`;
            }
        }
        return `[${timestamp}] [${level.padEnd(5)}] [${context}] ${message}${metaStr}\n`;
    }

    write(level, context, message, meta) {
        const line = this.formatLog(level, context, message, meta);

        // Always print to console in dev mode
        if (level === 'ERROR') {
            console.error(`[${context}]`, message, meta || '');
        } else if (level === 'WARN') {
            console.warn(`[${context}]`, message, meta || '');
        } else {
            console.log(`[${context}]`, message, meta || '');
        }

        // Asynchronous non-blocking write to file
        try {
            if (this.writeStream && !this.writeStream.destroyed) {
                this.writeStream.write(line);
            }
        } catch {}
    }

    info(context, message, meta) {
        this.write('INFO', context, message, meta);
    }

    warn(context, message, meta) {
        this.write('WARN', context, message, meta);
    }

    error(context, message, meta) {
        this.write('ERROR', context, message, meta);
    }

    debug(context, message, meta) {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
            this.write('DEBUG', context, message, meta);
        }
    }

    logFatalCrash(error, context = 'ProcessCrash') {
        const timestamp = new Date().toISOString();
        const crashDetails = [
            '=================================================================',
            `FATAL CRASH REPORT - ${timestamp}`,
            `Context: ${context}`,
            `Error: ${error ? (error.stack || error.message || error) : 'Unknown Fatal Error'}`,
            `Platform: ${process.platform} (${process.arch})`,
            `Electron Version: ${process.versions.electron}`,
            `Node Version: ${process.versions.node}`,
            '=================================================================\n\n'
        ].join('\n');

        console.error(crashDetails);

        try {
            fs.appendFileSync(this.crashFilePath, crashDetails, 'utf8');
            this.error(context, 'Fatal application crash recorded to crash.log', error);
        } catch (writeErr) {
            console.error('[Logger] Failed to write crash log:', writeErr.message);
        }
    }

    getLogsDirectory() {
        return this.logsDir;
    }

    openLogsFolder() {
        if (this.logsDir && fs.existsSync(this.logsDir)) {
            shell.openPath(this.logsDir);
        }
    }

    close() {
        if (this.writeStream) {
            this.writeStream.end();
            this.writeStream = null;
        }
    }
}

const logger = new Logger();
module.exports = { logger, Logger };
