import React from 'react';
import { DoltCommit } from '../types';
import { GitCommit, GitBranch, RotateCcw } from 'lucide-react';

interface TimelineProps {
  commits: DoltCommit[];
  onFork: () => void;
  onRestore: (commit: DoltCommit) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ commits, onFork, onRestore }) => {
  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center">
        <span className="text-xs text-blue-400 font-bold tracking-wider flex items-center gap-2">
          <GitBranch size={12} />
          DOLT :: MULTIVERSE LOG
        </span>
        <button 
          onClick={onFork}
          className="text-[10px] bg-blue-900/30 text-blue-300 border border-blue-800 px-2 py-0.5 rounded hover:bg-blue-800/50 transition-colors"
        >
          dolt branch
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-2 space-y-4 font-mono text-xs">
        <div className="relative pl-4 border-l border-neutral-800 space-y-6">
          {commits.slice().reverse().map((commit) => (
            <div key={commit.hash} className="relative group">
              {/* Timeline Dot */}
              <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 transition-colors ${
                commit.active 
                  ? 'bg-blue-500 border-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                  : 'bg-neutral-900 border-neutral-600 group-hover:border-blue-400'
              }`}></div>
              
              <div 
                onClick={() => !commit.active && onRestore(commit)}
                className={`p-2 rounded border cursor-pointer transition-all ${
                  commit.active 
                    ? 'bg-neutral-900 border-blue-900/50' 
                    : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                <div className="flex justify-between text-neutral-500 mb-1">
                  <span className="flex items-center gap-1 font-mono">
                    <GitCommit size={10}/> 
                    {commit.hash.substring(0, 7)}
                  </span>
                  <span>{commit.timestamp}</span>
                </div>
                <div className="text-neutral-300 font-semibold">{commit.message}</div>
                <div className="flex justify-between items-end mt-1">
                   <div className="text-neutral-500 text-[10px]">Branch: <span className="text-orange-400">{commit.branch}</span></div>
                   {!commit.active && (
                     <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-blue-900/20 px-1 rounded">
                       <RotateCcw size={8} /> REVERT
                     </span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};