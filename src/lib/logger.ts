/**
 * Logger Estruturado — PH Service
 * 
 * Substitui console.error/log espalhados pelo código por um logger
 * centralizado, preparado para integração futura com Sentry, LogRocket, etc.
 * 
 * Em produção, pode ser redirecionado para um serviço externo.
 * Em dev, mantém o comportamento padrão do console.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    module: string;
    message: string;
    data?: Record<string, unknown>;
    error?: Error | unknown;
    timestamp: string;
}

function formatEntry(entry: LogEntry): string {
    return `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}] ${entry.message}`;
}

function createLogEntry(
    level: LogLevel,
    module: string,
    message: string,
    data?: Record<string, unknown>,
    error?: Error | unknown
): LogEntry {
    return {
        level,
        module,
        message,
        data,
        error,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Cria um logger com escopo específico para um módulo.
 * 
 * Uso:
 * ```ts
 * const log = createLogger('boletos.action');
 * log.info('Boleto criado', { id: '123' });
 * log.error('Erro ao criar boleto', { input }, error);
 * ```
 */
export function createLogger(module: string) {
    return {
        info(message: string, data?: Record<string, unknown>) {
            const entry = createLogEntry('info', module, message, data);
            if (process.env.NODE_ENV !== 'production') {
                console.log(formatEntry(entry), data || '');
            }
            // TODO: Em produção, enviar para serviço de logging externo
        },

        warn(message: string, data?: Record<string, unknown>) {
            const entry = createLogEntry('warn', module, message, data);
            console.warn(formatEntry(entry), data || '');
        },

        error(message: string, data?: Record<string, unknown>, error?: unknown) {
            const entry = createLogEntry('error', module, message, data, error);
            console.error(formatEntry(entry), data || '');
            if (error) {
                console.error(error);
            }
            // TODO: Em produção, enviar para Sentry/LogRocket/DataDog
            // Sentry.captureException(error, { extra: { module, message, ...data } });
        },

        debug(message: string, data?: Record<string, unknown>) {
            if (process.env.NODE_ENV !== 'production') {
                const entry = createLogEntry('debug', module, message, data);
                console.debug(formatEntry(entry), data || '');
            }
        },
    };
}
