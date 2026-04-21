/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';

/**
 * Hook para manejar la lógica de depuración.
 * @returns { debugLogs, addLog, clearLogs }
 */
export const useDebugger = () => {
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = (msg: string, ...args: any[]) => {
        const argsString = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        const fullMessage = `${msg} ${argsString}`.trim();
        setDebugLogs(prev => [...prev, fullMessage]);
        console.log(msg, ...args);
    };

    const clearLogs = () => setDebugLogs([]);

    return { debugLogs, addLog, clearLogs };
};

interface DebugConsoleProps {
    logs: string[];
}

/**
 * Componente visual para mostrar los logs de depuración.
 * 
 * Forma de uso:
 * 
 * 1. Importar el hook y el componente:
 *    import { useDebugger, DebugConsole } from '../debugger/DebugConsole';
 * 
 * 2. Inicializar el hook en tu componente:
 *    const { debugLogs, addLog, clearLogs } = useDebugger();
 * 
 * 3. Utilizar `addLog` para añadir información o `clearLogs` para limpiar:
 *    addLog("Iniciando proceso...");
 *    clearLogs();
 * 
 * 4. Renderizar el componente pasando los logs en tu JSX:
 *    <DebugConsole logs={debugLogs} />
 */
export const DebugConsole: React.FC<DebugConsoleProps> = ({ logs }) => {
    if (logs.length === 0) return null;

    return (
        <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#1e1e1e', color: '#00ff00', fontSize: '13px', textAlign: 'left', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto', width: '100%', maxWidth: '400px', wordWrap: 'break-word', fontFamily: 'monospace' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffffff', fontSize: '15px' }}>🖥️ Depuración Live</h4>
            {logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '6px', borderBottom: '1px solid #333', paddingBottom: '3px' }}>
                    {log}
                </div>
            ))}
        </div>
    );
};
