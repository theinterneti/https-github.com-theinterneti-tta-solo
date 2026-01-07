export interface LogEntry {
  id: string;
  type: 'neural' | 'symbolic' | 'system' | 'user';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface EntityNode {
  id: string;
  label: string;
  type: 'Character' | 'Location' | 'Item' | 'Concept';
  x: number;
  y: number;
  data?: Record<string, any>; // For the inspector
}

export interface EntityLink {
  source: string;
  target: string;
  label: string;
}

export interface GameState {
  hp: number;
  maxHp: number;
  location: string;
  inventory: string[];
}

export interface WorldSnapshot {
  gameState: GameState;
  nodes: EntityNode[];
  links: EntityLink[];
  logs: LogEntry[];
}

export interface DoltCommit {
  hash: string;
  message: string;
  branch: string;
  timestamp: string;
  active: boolean;
  snapshot?: WorldSnapshot;
}

export type ViewMode = 'console' | 'specs' | 'db';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

export interface EngineResponse {
  narrative: string;
  trace: string;
  stateUpdates?: Partial<GameState>;
  newNodes?: EntityNode[];
  newLinks?: EntityLink[];
  commitMessage?: string;
}