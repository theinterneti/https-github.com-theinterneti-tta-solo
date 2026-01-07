import { GoogleGenAI } from "@google/genai";
import { LogEntry, GameState, EntityNode, EntityLink, FileNode, EngineResponse } from "../types";

// Safe API Key retrieval that won't crash in browsers without process defined
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const API_KEY = getApiKey();

let client: GoogleGenAI | null = null;

if (API_KEY) {
  client = new GoogleGenAI({ apiKey: API_KEY });
}

// Helper to extract code from the virtual file system for the prompt
const extractContextFromFiles = (nodes: FileNode[]): string => {
  let output = "";
  const traverse = (n: FileNode) => {
    if (n.type === 'file' && n.content) {
      output += `\n--- START OF FILE ${n.name} ---\n${n.content}\n--- END OF FILE ${n.name} ---\n`;
    }
    if (n.children) n.children.forEach(traverse);
  };
  nodes.forEach(traverse);
  return output;
};

export const runEngineSimulation = async (
  input: string,
  currentState: GameState,
  graphNodes: EntityNode[],
  files: FileNode[],
  history: LogEntry[]
): Promise<EngineResponse> => {
  
  // FALLBACK: If no API Key, run a deterministic mock simulation
  if (!client) {
    return runMockSimulation(input, currentState);
  }

  try {
    const fileContext = extractContextFromFiles(files);
    const stateContext = JSON.stringify(currentState, null, 2);
    const graphContext = JSON.stringify(graphNodes.map(n => n.label), null, 2);

    const prompt = `
      ROLE:
      You are the "TTA-Solo Engine", a Neuro-Symbolic Game Master.
      You are simulating the execution of the Python code provided in the FILE CONTEXT.

      TASK:
      1. Analyze the USER INPUT.
      2. "Execute" the relevant Python Skills (conceptually) found in the FILE CONTEXT.
      3. Apply the logic to the CURRENT STATE.
      4. Generate a JSON response representing the outcome.

      FILE CONTEXT (The Codebase):
      ${fileContext}

      CURRENT STATE (Dolt DB):
      ${stateContext}

      KNOWLEDGE GRAPH (Neo4j):
      ${graphContext}

      USER INPUT:
      "${input}"

      OUTPUT FORMAT (JSON ONLY):
      {
        "narrative": "The story output (2 sentences max, dark fantasy style).",
        "trace": "The simulated terminal output of the python scripts (e.g. '> python src/skills/combat.py...').",
        "stateUpdates": { "hp": 18, "inventory": ["..."] }, (Only include fields that CHANGED)
        "newNodes": [ { "id": "...", "label": "...", "type": "...", "x": 0, "y": 0 } ], (Any NEW graph entities discovered)
        "newLinks": [ { "source": "...", "target": "...", "label": "..." } ],
        "commitMessage": "Git commit message for the action"
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText) as EngineResponse;
    return result;

  } catch (error) {
    console.error("Engine Error:", error);
    return {
      narrative: "The engine stutters. A connection to the Neural Plane (API) failed.",
      trace: `[ERROR] ${error}`,
    };
  }
};

// A deterministic mock for when API keys are missing
const runMockSimulation = (input: string, state: GameState): EngineResponse => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('attack')) {
    const hit = Math.random() > 0.4;
    return {
      narrative: hit 
        ? "Your blade finds purchase in the creature's hide. It screeches in recoil."
        : "You lunge, but the creature is faster. Your weapon strikes only air.",
      trace: `> python3 src/skills/combat.py --target=enemy\n[INFO] Rolling d20... ${hit ? 'HIT' : 'MISS'}`,
      commitMessage: `Action: Attack (${hit ? 'Hit' : 'Miss'})`
    };
  }

  if (lowerInput.includes('look')) {
    return {
      narrative: "You perceive details previously hidden in the shadows.",
      trace: `> python3 src/skills/query_lore.py --scan\n[INFO] Found 1 new entity.`,
      newNodes: [
        { id: `gen_${Date.now()}`, label: 'Hidden Rune', type: 'Item', x: 250, y: 250 }
      ],
      newLinks: [
        { source: 'player', target: `gen_${Date.now()}`, label: 'SEES' }
      ],
      commitMessage: "Action: Perception Check"
    };
  }

  return {
    narrative: "You hesitate, considering your next move.",
    trace: `> python3 src/skills/parse_intent.py "${input}"\n[WARN] Intent unclear.`,
    commitMessage: "Action: Wait"
  };
};