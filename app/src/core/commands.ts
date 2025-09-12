export interface Command<Result = void> {
  readonly name: string;
  execute(state: DiagramState): { state: DiagramState; result?: Result };
  invert?(prev: DiagramState, next: DiagramState): Command | undefined;
}

export interface DiagramState {
  schemaVersion: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selection: string[];
  metadata: { title: string };
}

export interface DiagramNode {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  data?: Record<string, unknown>;
}

export interface DiagramEdge {
  id: string;
  source: { nodeId: string };
  target: { nodeId: string };
  type: string;
}

export const initialState: DiagramState = {
  schemaVersion: '1.0.0',
  nodes: [],
  edges: [],
  selection: [],
  metadata: { title: 'Untitled Diagram' }
};

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private _state: DiagramState;

  constructor(initial: DiagramState) {
    this._state = initial;
  }

  get state() { return this._state; }

  dispatch(cmd: Command): void {
    const prev = this._state;
    const { state: next } = cmd.execute(prev);
    this._state = next;
    const inverse = cmd.invert ? cmd.invert(prev, next) : undefined;
    if (inverse) this.undoStack.push(inverse); else this.undoStack.push(new SnapshotCommand(prev));
    this.redoStack = [];
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    const prev = this._state;
    const { state: next } = cmd.execute(prev);
    this._state = next;
    const inverse = cmd.invert ? cmd.invert(prev, next) : undefined;
    if (inverse) this.redoStack.push(inverse); else this.redoStack.push(new SnapshotCommand(prev));
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    const prev = this._state;
    const { state: next } = cmd.execute(prev);
    this._state = next;
    const inverse = cmd.invert ? cmd.invert(prev, next) : undefined;
    if (inverse) this.undoStack.push(inverse); else this.undoStack.push(new SnapshotCommand(prev));
  }
}

class SnapshotCommand implements Command {
  name = 'snapshot';
  private snapshot: DiagramState;
  constructor(snapshot: DiagramState) { this.snapshot = snapshot; }
  execute(_current: DiagramState) { return { state: structuredClone(this.snapshot) }; }
}

export class AddNode implements Command {
  name = 'addNode';
  private node: DiagramNode;
  constructor(node: Partial<DiagramNode>) {
    this.node = {
      id: node.id ?? crypto.randomUUID(),
      type: node.type ?? 'process',
      x: node.x ?? 0,
      y: node.y ?? 0,
      w: node.w ?? 160,
      h: node.h ?? 60,
      data: node.data ?? {}
    };
  }
  execute(state: DiagramState) {
    return { state: { ...state, nodes: [...state.nodes, this.node] } };
  }
  invert(prev: DiagramState) {
    const id = this.node.id;
    return new RemoveNode(id);
  }
}

export class RemoveNode implements Command {
  name = 'removeNode';
  constructor(private id: string) {}
  execute(state: DiagramState) {
    return { state: { ...state, nodes: state.nodes.filter(n => n.id !== this.id) } };
  }
  invert(prev: DiagramState) {
    const node = prev.nodes.find(n => n.id === this.id);
    return node ? new AddNode(node) : undefined;
  }
}

export class ReplaceState implements Command {
  name = 'replaceState';
  private nextState: DiagramState;
  constructor(next: DiagramState) {
    this.nextState = structuredClone(next);
  }
  execute(_state: DiagramState) { return { state: structuredClone(this.nextState) }; }
  invert(prev: DiagramState) { return new ReplaceState(prev); }
}
