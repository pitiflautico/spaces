/**
 * PROTOCOLO DE LOGS
 * Sistema de logging con exportación a .txt
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  moduleId: string
  message: string
  metadata?: Record<string, unknown>
}

export interface ModuleLog {
  moduleId: string
  moduleName: string
  entries: LogEntry[]
  createdAt: Date
  updatedAt: Date
}
