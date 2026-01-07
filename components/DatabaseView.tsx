import React, { useState } from 'react';
import { EntityNode } from '../types';
import { Database, Plus, Trash2, Search } from 'lucide-react';

interface DatabaseViewProps {
  nodes: EntityNode[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  selectedId: string | null;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ nodes, onSelect, onDelete, onCreate, selectedId }) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [search, setSearch] = useState('');

  // Safe filtering in case nodes is undefined
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  
  const filteredNodes = safeNodes.filter(node => {
    const matchesType = filterType === 'All' || node.type === filterType;
    const matchesSearch = (node.label || '').toLowerCase().includes(search.toLowerCase()) || 
                          (node.id || '').toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden shadow-lg shadow-blue-900/5">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-400 font-bold tracking-wider text-xs">
                <Database size={16} />
                <span>DOLT :: TABLE VIEW</span>
            </div>
            <div className="h-4 w-px bg-neutral-700"></div>
            <div className="flex gap-2">
                {['All', 'Character', 'Location', 'Item'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-colors ${
                            filterType === type 
                            ? 'bg-blue-900/50 text-blue-300 border border-blue-800' 
                            : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
        
        <div className="flex items-center gap-3">
             <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500"/>
                <input 
                    type="text" 
                    placeholder="Search entities..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 rounded pl-7 pr-2 py-1 text-xs text-neutral-300 focus:outline-none focus:border-blue-500 w-48 font-mono"
                />
             </div>
             <button 
                onClick={onCreate}
                className="flex items-center gap-1 bg-green-900/20 text-green-500 border border-green-900/50 hover:bg-green-900/40 px-3 py-1 rounded text-xs transition-colors font-bold"
             >
                <Plus size={14} /> NEW ROW
             </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-grow overflow-auto bg-black">
        <table className="w-full text-left border-collapse">
            <thead className="bg-neutral-900/80 text-neutral-500 text-[10px] font-mono uppercase sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                    <th className="p-3 border-b border-neutral-800 w-24">ID</th>
                    <th className="p-3 border-b border-neutral-800 w-48">Label</th>
                    <th className="p-3 border-b border-neutral-800 w-32">Type</th>
                    <th className="p-3 border-b border-neutral-800">Data Preview</th>
                    <th className="p-3 border-b border-neutral-800 w-16 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="text-xs font-mono text-neutral-300 divide-y divide-neutral-900">
                {filteredNodes.map(node => (
                    <tr 
                        key={node.id} 
                        onClick={() => onSelect(node.id)}
                        className={`group cursor-pointer transition-colors ${
                            selectedId === node.id ? 'bg-blue-900/20' : 'hover:bg-neutral-900'
                        }`}
                    >
                        <td className="p-3 text-neutral-500">{node.id}</td>
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full shadow-[0_0_5px] ${
                                node.type === 'Character' ? 'bg-red-500 shadow-red-500/50' : node.type === 'Location' ? 'bg-blue-500 shadow-blue-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
                            }`}></span>
                            {node.label}
                        </td>
                        <td className="p-3 opacity-70">{node.type}</td>
                        <td className="p-3 text-neutral-500 truncate max-w-xs opacity-60 group-hover:opacity-100 transition-opacity">
                            {JSON.stringify(node.data || {})}
                        </td>
                        <td className="p-3 text-right">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-900/20 rounded transition-all"
                                title="Delete Entity"
                             >
                                <Trash2 size={12} />
                             </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        
        {filteredNodes.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-600 gap-2">
                <Database size={32} className="opacity-20" />
                <span className="text-xs font-mono">Query returned 0 rows.</span>
            </div>
        )}
      </div>
      
      {/* Footer Stats */}
      <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 text-[10px] text-neutral-500 font-mono flex gap-4">
          <span>TOTAL ROWS: {safeNodes.length}</span>
          <span>FILTERED: {filteredNodes.length}</span>
          <span className="text-blue-500">SYNC: OK</span>
      </div>
    </div>
  );
};