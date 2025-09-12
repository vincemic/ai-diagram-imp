export interface NodeTypeDefinition {
  type: string;
  defaultSize: { w: number; h: number };
}

const nodeTypes = new Map<string, NodeTypeDefinition>();

export function registerNodeType(def: NodeTypeDefinition) {
  if (nodeTypes.has(def.type)) {
    console.warn(`Node type already registered: ${def.type}`);
    return;
  }
  nodeTypes.set(def.type, def);
}

export function getNodeType(type: string) {
  return nodeTypes.get(type);
}
