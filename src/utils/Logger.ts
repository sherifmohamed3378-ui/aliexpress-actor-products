export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(context: string): ILogger;
}

export class ConsoleLogger implements ILogger {
  constructor(
    private readonly context: string = 'Engine',
    private readonly level: LogLevel = 'info'
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    return order[level] >= order[this.level];
  }

  private format(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const ts = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta).slice(0, 500)}` : '';
    return `[${ts}] [${level.toUpperCase()}] [${this.context}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) console.debug(this.format('debug', message, meta));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('info')) console.info(this.format('info', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) console.warn(this.format('warn', message, meta));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('error')) console.error(this.format('error', message, meta));
  }

  child(context: string): ILogger {
    return new ConsoleLogger(`${this.context}:${context}`, this.level);
  }
}

export class NoOpLogger implements ILogger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
  child(): ILogger { return this; }
}

export const logger = new ConsoleLogger('AliExpressEngine', 'info');
