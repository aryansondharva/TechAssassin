/**
 * Logger Service
 * 
 * Centralized logging for the TechAssassin backend
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    // Set log level based on environment
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
      this.logLevel = LogLevel.DEBUG;
    } else if (process.env.VERBOSE_LOGGING === 'true') {
      this.logLevel = LogLevel.DEBUG;
    } else {
      this.logLevel = LogLevel.INFO;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(level: string, message: string, meta?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
    };
  }

  private log(level: LogLevel, levelName: string, message: string, meta?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatMessage(levelName, message, meta);
    
    // Console output with colors for development
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m',  // Yellow
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[37m', // White
      };
      const reset = '\x1b[0m';
      
      console.log(
        `${colors[levelName]}[${logEntry.timestamp}] ${levelName}:${reset} ${message}`,
        meta ? meta : ''
      );
    } else {
      // Production logging (structured)
      console.log(JSON.stringify(logEntry));
    }
  }

  public error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, 'ERROR', message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  public info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  /**
   * Log database operations
   */
  public db(message: string, meta?: any): void {
    if (process.env.DATABASE_LOGGING === 'true') {
      this.debug(`[DB] ${message}`, meta);
    }
  }

  /**
   * Log API requests
   */
  public api(message: string, meta?: any): void {
    this.info(`[API] ${message}`, meta);
  }

  /**
   * Log authentication events
   */
  public auth(message: string, meta?: any): void {
    this.info(`[AUTH] ${message}`, meta);
  }

  /**
   * Log email operations
   */
  public email(message: string, meta?: any): void {
    this.info(`[EMAIL] ${message}`, meta);
  }

  /**
   * Log performance metrics
   */
  public performance(message: string, meta?: any): void {
    this.info(`[PERF] ${message}`, meta);
  }
}

export const logger = Logger.getInstance();
