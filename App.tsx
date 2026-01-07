import React, { useState } from 'react';
import { Terminal } from './components/Terminal';
import { GraphView } from './components/GraphView';
import { Timeline } from './components/Timeline';
import { SkillPanel } from './components/SkillPanel';
import { SpecEditor } from './components/SpecEditor';
import { DatabaseView } from './components/DatabaseView';
import { runEngineSimulation } from './services/geminiService';
import { LogEntry, EntityNode, EntityLink, DoltCommit, GameState, ViewMode, FileNode, WorldSnapshot } from './types';
import { BookOpen, Cpu, Share2, Layers } from 'lucide-react';

const INITIAL_NODES: EntityNode[] = [
  { id: 'player', label: 'Player', type: 'Character', x: 200, y: 150, data: { class: "Rogue", level: 1 } },
  { id: 'loc1', label: 'Dark Forest', type: 'Location', x: 100, y: 100, data: { dangerLevel: "High", ambience: "Spooky" } },
  { id: 'npc1', label: 'Goblin Scout', type: 'Character', x: 300, y: 100, data: { hp: 7, ac: 12, weapon: "Shortbow" } },
  { id: 'item1', label: 'Rusty Dagger', type: 'Item', x: 250, y: 200, data: { damage: "1d4", value: 2 } },
];

const INITIAL_LINKS: EntityLink[] = [
  { source: 'player', target: 'loc1', label: 'LOCATED_AT' },
  { source: 'npc1', target: 'loc1', label: 'GUARDS' },
  { source: 'player', target: 'item1', label: 'OWNS' },
  { source: 'npc1', target: 'player', label: 'HATES' },
];

const INITIAL_LOGS: LogEntry[] = [
    { 
      id: 'init', 
      type: 'system', 
      content: 'System Initialized. Neuro-Symbolic Engine Active.\nLoad "src/skills/combat.py" to review logic.', 
      timestamp: Date.now() 
    },
    {
      id: 'intro',
      type: 'neural',
      content: 'You stand at the edge of the Dark Forest. A Goblin Scout watches you from the shadows.',
      timestamp: Date.now() + 100
    }
];

const INITIAL_STATE: GameState = {
  hp: 20,
  maxHp: 20,
  location: "Dark Forest (Edge)",
  inventory: ["Rations", "Torches (3)", "Map"]
};

// Initial snapshot to allow reverting to start
const GENESIS_SNAPSHOT: WorldSnapshot = {
  gameState: INITIAL_STATE,
  nodes: INITIAL_NODES,
  links: INITIAL_LINKS,
  logs: INITIAL_LOGS
};

const INITIAL_COMMITS: DoltCommit[] = [
  { hash: 'a1b2c3d', message: 'Init: World Generation', branch: 'main', timestamp: '10:00:00', active: false, snapshot: GENESIS_SNAPSHOT },
  { hash: 'e5f6g7h', message: 'Event: Entered Forest', branch: 'main', timestamp: '10:05:22', active: true, snapshot: GENESIS_SNAPSHOT },
];

const INITIAL_FILES: FileNode[] = [
  {
    id: 'system_prompt',
    name: 'system_prompt.md',
    type: 'file',
    content: `# System Axioms\n\n1. Dolt is Truth.\n2. Neo4j is Knowledge.\n3. Python is Logic.`
  },
  {
    id: 'specs',
    name: 'specs',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'ontology',
        name: 'ontology.md',
        type: 'file',
        content: `# Core Ontology\n\n## Entities\n- **Character**: { hp, ac, str, dex }\n- **Location**: { description, exits }`
      },
      {
        id: 'mechanics',
        name: 'mechanics.md',
        type: 'file',
        content: `# Combat Rules\n\n1. Roll d20.\n2. If roll > Target AC (12), HIT.\n3. Damage = 1d6 + STR_MOD (2).`
      }
    ]
  },
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'skills',
        name: 'skills',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'combat_py',
            name: 'combat.py',
            type: 'file',
            content: `def attack(target_id: str):\n    print(f"initiating combat with {target_id}")\n    roll = dice.d20()\n    print(f"Rolled: {roll}")\n    if roll > 12: \n        dmg = dice.d6() + 2\n        return {"result": "HIT", "damage": dmg}\n    else:\n        return {"result": "MISS", "damage": 0}`
          },
          {
            id: 'dice_py',
            name: 'dice.py',
            type: 'file',
            content: `import random\n\ndef d20():\n    return random.randint(1, 20)\n\ndef d6():\n    return random.randint(1, 6)`
          }
        ]
      }
    ]
  }
];


const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('console');
  const [input, setInput] = useState('');
  
  // World State
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [nodes, setNodes] = useState<EntityNode[]>(INITIAL_NODES);
  const [links, setLinks] = useState<EntityLink[]>(INITIAL_LINKS);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [commits, setCommits] = useState<DoltCommit[]>(INITIAL_COMMITS);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [lastTrace, setLastTrace] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [files, setFiles] = useState(INITIAL_FILES);
  const [currentBranch, setCurrentBranch] = useState('main');

  // Defined early to avoid hoisting issues in closures
  const createSnapshot = (
    gs: GameState, 
    ns: EntityNode[], 
    ls: EntityLink[], 
    lgs: LogEntry[], 
    message: string,
    isManual = false
  ) => {
    const newSnapshot: WorldSnapshot = {
      gameState: gs,
      nodes: ns,
      links: ls,
      logs: lgs
    };

    setCommits(prev => [
      ...prev.map(c => ({...c, active: false})),
      { 
        hash: Math.random().toString(16).substr(2, 7), 
        message: message, 
        branch: currentBranch, 
        timestamp: new Date().toLocaleTimeString(), 
        active: true,
        snapshot: newSnapshot 
      }
    ]);
  };

  const executeSkill = async (command: string) => {
    // 1. Optimistic Log
    const userLog: LogEntry = {
      id: Date.now().toString(),
      type: 'user',
      content: command,
      timestamp: Date.now()
    };
    const nextLogs = [...logs, userLog];
    setLogs(nextLogs);
    setInput('');
    setLoading(true);

    // 2. Engine Simulation
    const result = await runEngineSimulation(command, gameState, nodes, files, nextLogs);

    // 3. Calculate New State
    let nextGameState = { ...gameState };
    if (result.stateUpdates) {
      nextGameState = { ...nextGameState, ...result.stateUpdates };
    }

    let nextNodes = [...nodes];
    let nextLinks = [...links];
    
    if (result.newNodes || result.newLinks) {
      const newNodesWithCoords = (result.newNodes || []).map(n => ({
         ...n,
         x: n.x || 200 + (Math.random() * 100 - 50),
         y: n.y || 150 + (Math.random() * 100 - 50)
      }));
      nextNodes = [...nextNodes, ...newNodesWithCoords];
      if (result.newLinks) nextLinks = [...nextLinks, ...result.newLinks];
    }

    const finalLogs: LogEntry[] = [...nextLogs];
    if (result.trace) {
      finalLogs.push({
        id: Date.now().toString() + '_sym',
        type: 'symbolic',
        content: `[EXEC] ${result.trace.split('\n')[0]}...`,
        timestamp: Date.now()
      });
      setLastTrace(result.trace);
    }
    finalLogs.push({
      id: Date.now().toString() + '_neu',
      type: 'neural',
      content: result.narrative,
      timestamp: Date.now() + 10
    });

    // 4. Update React State
    setGameState(nextGameState);
    setNodes(nextNodes);
    setLinks(nextLinks);
    setLogs(finalLogs);

    // 5. Create Snapshot & Commit
    createSnapshot(nextGameState, nextNodes, nextLinks, finalLogs, result.commitMessage || `Action: ${command}`);

    setLoading(false);
  };

  const handleRestoreSnapshot = (commit: DoltCommit) => {
    if (!commit.snapshot) return;
    
    console.log(`Time Travelling to commit ${commit.hash}...`);
    
    setGameState(commit.snapshot.gameState);
    setNodes(commit.snapshot.nodes);
    setLinks(commit.snapshot.links);
    setLogs(commit.snapshot.logs);
    
    setCommits(prev => prev.map(c => ({
      ...c,
      active: c.hash === commit.hash
    })));

    setLogs(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: `>>> TIME TRAVEL INITIATED. Reverted reality to commit ${commit.hash}.`,
      timestamp: Date.now()
    }]);
  };

  const handleFork = () => {
    const newBranchName = `fork-${Math.floor(Math.random() * 1000)}`;
    setCurrentBranch(newBranchName);
    
    const currentSnapshot: WorldSnapshot = {
      gameState, nodes, links, logs
    };

    setCommits(prev => [
      ...prev,
      {
        hash: Math.random().toString(16).substr(2, 7),
        message: `Branch Created: ${newBranchName}`,
        branch: newBranchName,
        timestamp: new Date().toLocaleTimeString(),
        active: true,
        snapshot: currentSnapshot
      }
    ]);
    
    setLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `Reality Forked. Switched to branch '${newBranchName}'.`,
        timestamp: Date.now()
    }]);
  };

  const handleSaveSpec = (fileId: string, content: string) => {
    const updateFile = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === fileId) return { ...node, content: content };
        if (node.children) return { ...node, children: updateFile(node.children) };
        return node;
      });
    };
    setFiles(updateFile(files));
  };

  const handleNodeMove = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => node.id === id ? { ...node, x, y } : node));
  };

  const handleUpdateEntity = (id: string, newData: Record<string, any>) => {
    // 1. Update Node
    const nextNodes = nodes.map(node => node.id === id ? { ...node, data: newData } : node);
    setNodes(nextNodes);

    // 2. Log Change
    const sysLog: LogEntry = {
        id: Date.now().toString(),
        type: 'system',
        content: `[ARCHITECT] Manual override on Entity '${id}'. Data patched.`,
        timestamp: Date.now()
    };
    const nextLogs = [...logs, sysLog];
    setLogs(nextLogs);

    // 3. Commit to Dolt
    createSnapshot(gameState, nextNodes, links, nextLogs, `Manual Edit: Entity ${id}`, true);
  };

  const handleCreateNode = () => {
    const id = `ent_${Date.now()}`;
    const newNode: EntityNode = {
        id,
        label: 'New Entity',
        type: 'Item',
        x: 200 + (Math.random() * 40 - 20),
        y: 150 + (Math.random() * 40 - 20),
        data: {}
    };
    
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeId(id);

    const sysLog: LogEntry = {
        id: Date.now().toString(),
        type: 'system',
        content: `[DB] Inserted new row '${id}'.`,
        timestamp: Date.now()
    };
    const nextLogs = [...logs, sysLog];
    setLogs(nextLogs);

    createSnapshot(gameState, nextNodes, links, nextLogs, `DB: Insert ${id}`, true);
  };

  const handleDeleteNode = (id: string) => {
      const nextNodes = nodes.filter(n => n.id !== id);
      const nextLinks = links.filter(l => l.source !== id && l.target !== id);
      setNodes(nextNodes);
      setLinks(nextLinks);
      if (selectedNodeId === id) setSelectedNodeId(null);

      const sysLog: LogEntry = {
        id: Date.now().toString(),
        type: 'system',
        content: `[DB] Deleted row '${id}'. Cascading delete to ${links.length - nextLinks.length} links.`,
        timestamp: Date.now()
    };
    const nextLogs = [...logs, sysLog];
    setLogs(nextLogs);

    createSnapshot(gameState, nextNodes, nextLinks, nextLogs, `DB: Delete ${id}`, true);
  };

  // Helper to find selected node object
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="flex h-screen w-screen bg-black text-neutral-200 overflow-hidden">
      {/* Sidebar / Navigation */}
      <div className="w-16 flex flex-col items-center py-4 border-r border-neutral-800 bg-neutral-900 z-20">
        <div className="mb-8 p-2 bg-green-900/20 rounded-lg text-green-500">
          <Cpu size={24} />
        </div>
        <div className="flex flex-col gap-6 w-full">
           <button 
            onClick={() => setView('specs')}
            className={`p-3 transition-all border-l-2 relative group w-full flex justify-center ${view === 'specs' ? 'text-white border-green-500 bg-neutral-800' : 'text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800'}`}
           >
             <BookOpen size={20} />
             <span className="absolute left-14 bg-neutral-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">Specs</span>
           </button>
           
           <button 
            onClick={() => setView('console')}
            className={`p-3 transition-all border-l-2 relative group w-full flex justify-center ${view === 'console' ? 'text-white border-green-500 bg-neutral-800' : 'text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800'}`}
           >
             <Share2 size={20} />
             <span className="absolute left-14 bg-neutral-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">Console</span>
           </button>

           <button 
             onClick={() => setView('db')}
             className={`p-3 transition-all border-l-2 relative group w-full flex justify-center ${view === 'db' ? 'text-white border-green-500 bg-neutral-800' : 'text-neutral-400 border-transparent hover:text-white hover:bg-neutral-800'}`}
           >
             <Layers size={20} />
             <span className="absolute left-14 bg-neutral-800 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity">Dolt DB</span>
           </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-grow flex flex-col p-4 h-full gap-4">
        
        {/* Top Header */}
        <div className="flex-none flex items-center justify-between px-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
                <span className="text-green-500">PROJECT TTA-SOLO</span>
                <span className="text-xs font-mono text-neutral-500 px-2 py-1 border border-neutral-800 rounded">ARCHITECT MODE</span>
              </h1>
              <p className="text-xs text-neutral-500 mt-1">Neuro-Symbolic Engine Status: <span className="text-green-500">ONLINE</span></p>
            </div>
            <div className="flex gap-4 text-xs font-mono text-neutral-500">
                <span>MEM: 12%</span>
                <span>CPU: 4%</span>
                <span className="text-blue-500">DOLT: SYNCED</span>
            </div>
        </div>

        {/* Dynamic View Content */}
        {view === 'console' ? (
          <div className="flex-grow grid grid-cols-12 grid-rows-12 gap-4 h-full min-h-0">
            {/* Left Column: Narrative Console */}
            <div className="col-span-12 lg:col-span-5 row-span-12 h-full min-h-0">
              <Terminal 
                logs={logs} 
                input={input} 
                setInput={setInput} 
                onSubmit={() => executeSkill(input)}
                loading={loading}
              />
            </div>

            {/* Center Column: Graphs & Visuals */}
            <div className="col-span-12 lg:col-span-4 row-span-12 flex flex-col gap-4 min-h-0">
               <div className="flex-grow min-h-0 basis-1/2">
                 <GraphView 
                    nodes={nodes} 
                    links={links} 
                    onNodeSelect={(n) => setSelectedNodeId(n.id)}
                    onNodeMove={handleNodeMove}
                    selectedNodeId={selectedNodeId}
                  />
               </div>
               <div className="flex-grow min-h-0 basis-1/2">
                 <Timeline 
                   commits={commits} 
                   onFork={handleFork} 
                   onRestore={handleRestoreSnapshot}
                  />
               </div>
            </div>

            {/* Right Column: Skill Traces & State */}
            <div className="col-span-12 lg:col-span-3 row-span-12 min-h-0">
               <SkillPanel 
                  gameState={gameState} 
                  selectedNode={selectedNode}
                  lastSymbolicTrace={lastTrace} 
                  onUpdateEntity={handleUpdateEntity}
                />
            </div>
          </div>
        ) : view === 'specs' ? (
          <div className="flex-grow h-full min-h-0">
            <SpecEditor files={files} onSave={handleSaveSpec} />
          </div>
        ) : (
            // Database View (Master-Detail)
             <div className="flex-grow grid grid-cols-12 gap-4 h-full min-h-0">
                 <div className="col-span-12 lg:col-span-9 h-full min-h-0">
                     <DatabaseView 
                        nodes={nodes} 
                        selectedId={selectedNodeId}
                        onSelect={setSelectedNodeId}
                        onCreate={handleCreateNode}
                        onDelete={handleDeleteNode}
                     />
                 </div>
                 <div className="col-span-12 lg:col-span-3 h-full min-h-0">
                     <SkillPanel 
                        gameState={gameState} 
                        selectedNode={selectedNode}
                        lastSymbolicTrace={lastTrace} 
                        onUpdateEntity={handleUpdateEntity}
                     />
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default App;