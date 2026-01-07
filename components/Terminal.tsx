import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Send, Terminal as TerminalIcon } from 'lucide-react';

interface TerminalProps {
  logs: LogEntry[];
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, input, setInput, onSubmit, loading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-black border border-neutral-800 rounded-lg overflow-hidden shadow-lg shadow-green-900/5">
      {/* Header */}
      <div className="flex items-center px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400">
        <TerminalIcon size={14} className="mr-2" />
        <span className="font-mono">tty1 // tta-solo-engine</span>
        <div className="flex-grow" />
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          ONLINE
        </span>
      </div>

      {/* Output Area */}
      <div 
        ref={scrollRef}
        className="flex-grow p-4 overflow-y-auto space-y-4 font-mono text-sm"
      >
        {logs.map((log) => (
          <div key={log.id} className={`flex flex-col ${log.type === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-md border ${
              log.type === 'user' 
                ? 'bg-neutral-900 border-neutral-700 text-neutral-200' 
                : log.type === 'symbolic'
                ? 'bg-blue-950/30 border-blue-900/50 text-blue-300 font-bold'
                : log.type === 'system'
                ? 'text-yellow-500 italic text-xs'
                : 'text-green-400' // neural
            }`}>
              {log.type === 'symbolic' && <span className="text-[10px] uppercase tracking-widest text-blue-500 block mb-1">Syntax.Logic</span>}
              <div className="whitespace-pre-wrap">{log.content}</div>
            </div>
            <span className="text-[10px] text-neutral-600 mt-1 uppercase">
              {log.type} • {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center text-green-500 text-sm animate-pulse">
            <span className="mr-2">Neural Engine Thinking</span>
            <span className="loading-dots">...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-neutral-900 border-t border-neutral-800">
        <div className="flex items-center gap-2 relative">
          <span className="text-green-500 absolute left-3 top-1/2 -translate-y-1/2">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command (e.g., 'look around', 'attack goblin')"
            className="w-full bg-neutral-950 text-neutral-200 pl-8 pr-10 py-3 rounded border border-neutral-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none font-mono text-sm"
            disabled={loading}
            autoFocus
          />
          <button 
            onClick={onSubmit}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-neutral-800 text-green-500 rounded hover:bg-neutral-700 disabled:opacity-50 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};