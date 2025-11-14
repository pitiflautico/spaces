/**
 * SISTEMA DE LOGGING
 * Genera archivos .txt + consola interna
 */

import { LogEntry, LogLevel, ModuleLog } from '@/types/logs'

class Logger {
  private logs: Map<string, ModuleLog> = new Map()

  /**
   * Añade una entrada de log
   */
  log(
    moduleId: string,
    moduleName: string,
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      moduleId,
      message,
      metadata
    }

    let moduleLog = this.logs.get(moduleId)

    if (!moduleLog) {
      moduleLog = {
        moduleId,
        moduleName,
        entries: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      this.logs.set(moduleId, moduleLog)
    }

    moduleLog.entries.push(entry)
    moduleLog.updatedAt = new Date()

    // También log a consola
    this.consoleLog(entry)
  }

  /**
   * Log a consola del navegador
   */
  private consoleLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString()
    const message = `[${timestamp}] [${entry.level}] [${entry.moduleId}] ${entry.message}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata)
        break
      case LogLevel.INFO:
        console.info(message, entry.metadata)
        break
      case LogLevel.WARNING:
        console.warn(message, entry.metadata)
        break
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.metadata)
        break
    }
  }

  /**
   * Obtiene los logs de un módulo
   */
  getModuleLogs(moduleId: string): LogEntry[] {
    return this.logs.get(moduleId)?.entries || []
  }

  /**
   * Limpia los logs de un módulo
   */
  clearModuleLogs(moduleId: string): void {
    this.logs.delete(moduleId)
  }

  /**
   * Exporta los logs de un módulo a formato texto
   */
  exportToText(moduleId: string): string {
    const moduleLog = this.logs.get(moduleId)

    if (!moduleLog) {
      return ''
    }

    const lines: string[] = []
    lines.push('='.repeat(80))
    lines.push(`LOG DEL MÓDULO: ${moduleLog.moduleName}`)
    lines.push(`ID: ${moduleLog.moduleId}`)
    lines.push(`Creado: ${moduleLog.createdAt.toISOString()}`)
    lines.push(`Actualizado: ${moduleLog.updatedAt.toISOString()}`)
    lines.push('='.repeat(80))
    lines.push('')

    for (const entry of moduleLog.entries) {
      const timestamp = entry.timestamp.toISOString()
      lines.push(`[${timestamp}] [${entry.level}]`)
      lines.push(`  ${entry.message}`)

      if (entry.metadata) {
        lines.push(`  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`)
      }

      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Descarga los logs como archivo .txt
   */
  downloadLogs(moduleId: string, moduleName: string): void {
    const content = this.exportToText(moduleId)

    if (!content) {
      console.warn(`No hay logs para el módulo ${moduleId}`)
      return
    }

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    link.href = url
    link.download = `${moduleName.replace(/\s+/g, '_')}_${timestamp}.txt`
    link.click()

    URL.revokeObjectURL(url)
  }

  /**
   * Obtiene todos los logs
   */
  getAllLogs(): ModuleLog[] {
    return Array.from(this.logs.values())
  }
}

// Singleton
export const logger = new Logger()

// Métodos de conveniencia
export const logDebug = (moduleId: string, moduleName: string, message: string, metadata?: Record<string, unknown>) =>
  logger.log(moduleId, moduleName, LogLevel.DEBUG, message, metadata)

export const logInfo = (moduleId: string, moduleName: string, message: string, metadata?: Record<string, unknown>) =>
  logger.log(moduleId, moduleName, LogLevel.INFO, message, metadata)

export const logWarning = (moduleId: string, moduleName: string, message: string, metadata?: Record<string, unknown>) =>
  logger.log(moduleId, moduleName, LogLevel.WARNING, message, metadata)

export const logError = (moduleId: string, moduleName: string, message: string, metadata?: Record<string, unknown>) =>
  logger.log(moduleId, moduleName, LogLevel.ERROR, message, metadata)

export const logFatal = (moduleId: string, moduleName: string, message: string, metadata?: Record<string, unknown>) =>
  logger.log(moduleId, moduleName, LogLevel.FATAL, message, metadata)
