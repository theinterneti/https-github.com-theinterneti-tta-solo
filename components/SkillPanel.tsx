import React, { useState, useEffect } from 'react';
import { GameState, EntityNode } from '../types';
import { Shield, MapPin, Backpack, Activity, Search, Database, Save, AlertTriangle } from 'lucide-react';

interface SkillPanelProps {
  gameState: GameState;
  selectedNode: EntityNode | null;
  lastSymbolicTrace: string | null;
  onUpdateEntity: (id: string, newData: Record<string, any>) => void;
}

export const SkillPanel: React.FC<SkillPanelProps> = ({ gameState, selectedNode, lastSymbolicTrace, onUpdateEntity }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setJsonText(JSON.stringify(selectedNode.data || {}, null, 2));
      setError(null);
      setIsDirty(false);
    }
  }, [selectedNode]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    setIsDirty(true);
    try {
      JSON.parse(e.target.value);
      setError(null);
    } catch (err) {
      setError("Invalid JSON");
    }
  };

  const handleSave = () => {
    if (!selectedNode || error) return;
    try {
      const parsed = JSON.parse(jsonText);
      onUpdateEntity(selectedNode.id, parsed);
      setIsDirty(false);
    } catch (err) {
      setError("Failed to save");
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Inspector / State Panel */}
      <div className="bg-neutral-900 rounded border border-neutral-800 p-3 flex flex-col gap-3 min-h-[200px]">
        
        {selectedNode ? (
          // Entity Inspector View
          <>
             <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-1">
                <div className="text-xs text-purple-400 uppercase tracking-wider font-bold flex items-center gap-2">
                  <Search size={12} /> Entity Inspector
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 font-mono">ID: {selectedNode.id}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               <div className={`p-3 rounded-full text-white font-bold text-lg w-12 h-12 flex items-center justify-center border-2 border-black shadow-lg ${
                 selectedNode.type === 'Character' ? 'bg-red-600' : selectedNode.type === 'Location' ? 'bg-blue-600' : 'bg-emerald-600'
               }`}>
                 {selectedNode.label[0]}
               </div>
               <div>
                 <div className="text-lg font-bold text-white leading-none">{selectedNode.label}</div>
                 <div className="text-xs text-neutral-500 mt-1 font-mono">{selectedNode.type} Node</div>
               </div>
             </div>

             <div className="mt-2 flex-grow flex flex-col relative">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold">Raw Data (Dolt)</span>
                    {isDirty && (
                        <button 
                            onClick={handleSave}
                            disabled={!!error}
                            className="flex items-center gap-1 bg-green-900/50 hover:bg-green-800 text-green-400 px-2 py-0.5 rounded text-[10px] border border-green-800 transition-colors"
                        >
                            <Save size={10} /> COMMIT CHANGE
                        </button>
                    )}
                </div>
                <textarea 
                    className={`w-full h-32 bg-black/50 p-2 rounded border font-mono text-xs text-neutral-300 resize-none focus:outline-none focus:border-purple-500 custom-scrollbar ${
                        error ? 'border-red-900' : 'border-neutral-800'
                    }`}
                    value={jsonText}
                    onChange={handleJsonChange}
                    spellCheck={false}
                />
                {error && (
                    <div className="absolute bottom-2 right-2 text-red-500 text-[10px] flex items-center gap-1 bg-black/80 px-1 rounded">
                        <AlertTriangle size={10} /> {error}
                    </div>
                )}
             </div>
          </>
        ) : (
          // Default Player State View
          <>
            <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider font-bold flex items-center gap-2">
              <Database size={12} /> Active Player State
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-900/20 text-red-500 rounded"><Activity size={18} /></div>
                <div>
                  <div className="text-xs text-neutral-500">HP</div>
                  <div className="text-sm font-bold text-neutral-200">{gameState.hp} / {gameState.maxHp}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900/20 text-blue-500 rounded"><Shield size={18} /></div>
                <div>
                  <div className="text-xs text-neutral-500">AC</div>
                  <div className="text-sm font-bold text-neutral-200">14</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-900/20 text-yellow-500 rounded"><MapPin size={18} /></div>
              <div className="flex-grow min-w-0">
                  <div className="text-xs text-neutral-500">Location</div>
                  <div className="text-sm font-bold text-neutral-200 truncate">{gameState.location}</div>
                </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                <Backpack size={12} /> INVENTORY
              </div>
              <div className="flex flex-wrap gap-2">
                {gameState.inventory.map((item, i) => (
                  <span key={i} className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-300 border border-neutral-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Script Trace */}
      <div className="flex-grow bg-black rounded border border-neutral-800 p-3 overflow-hidden flex flex-col">
         <div className="text-xs text-green-600 mb-2 uppercase tracking-wider font-bold flex justify-between">
           <span>Python Skill Trace</span>
           <span className="text-[10px]">src/skills/*.py</span>
         </div>
         <div className="flex-grow font-mono text-xs text-neutral-400 whitespace-pre-wrap overflow-y-auto custom-scrollbar opacity-80">
           {lastSymbolicTrace || "// Waiting for input..."}
         </div>
      </div>
    </div>
  );
};