// ============================================================================
// Security Suite - Logger Utility
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',   // cyan
  info: '\x1b[32m',    // green
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private module: string;
  private level: LogLevel;
  private logFile?: string;
  private static globalLevel: LogLevel = 'info';
  private static logStream?: fs.WriteStream;

  constructor(module: string, level?: LogLevel) {
    this.module = module;
    this.level = level || Logger.globalLevel;
  }

  static setGlobalLevel(level: LogLevel): void {
    Logger.globalLevel = level;
  }

  static setLogFile(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    Logger.logStream = fs.createWriteStream(filePath, { flags: 'a' });
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level];
    const levelStr = level.toUpperCase().padEnd(5);
    const moduleStr = `[${this.module}]`.padEnd(25);

    const consoleMsg = `${color}${BOLD}${levelStr}${RESET} ${'\x1b[90m'}${timestamp}${RESET} ${moduleStr} ${message}`;
    const fileMsg = `${levelStr} ${timestamp} ${moduleStr} ${message}`;

    if (data) {
      const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      if (Logger.logStream) {
        Logger.logStream.write(`${fileMsg} ${dataStr}\n`);
      }
      return `${consoleMsg} ${'\x1b[90m'}${dataStr}${RESET}`;
    }

    if (Logger.logStream) {
      Logger.logStream.write(`${fileMsg}\n`);
    }
    return consoleMsg;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  banner(title: string): void {
    const line = '═'.repeat(60);
    console.log(`\n\x1b[36m${BOLD}╔${line}╗${RESET}`);
    console.log(`\x1b[36m${BOLD}║${RESET}  ${BOLD}${title.padEnd(58)}${RESET}\x1b[36m${BOLD}║${RESET}`);
    console.log(`\x1b[36m${BOLD}╚${line}╝${RESET}\n`);
  }

  separator(): void {
    console.log(`\x1b[90m${'─'.repeat(62)}${RESET}`);
  }
}
