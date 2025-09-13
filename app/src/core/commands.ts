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
      data: (() => {
        const data = { ...(node.data || {}) } as Record<string, unknown>;
        if (data.textColor === undefined) data.textColor = '#000000';
        if (data.backgroundColor === undefined) data.backgroundColor = '#ADD8E6';
        return data;
      })()
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

export class MoveNode implements Command {
  name = 'moveNode';
  private id: string;
  private x: number;
  private y: number;
  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }
  execute(state: DiagramState) {
    const nodes = state.nodes.map(n => n.id === this.id ? { ...n, x: this.x, y: this.y } : n);
    return { state: { ...state, nodes } };
  }
  invert(prev: DiagramState, next: DiagramState) {
    const prevNode = prev.nodes.find(n => n.id === this.id);
    if (!prevNode) return undefined;
    return new MoveNode(this.id, prevNode.x, prevNode.y);
  }
}

export class SetSelection implements Command {
  name = 'setSelection';
  private ids: string[];
  constructor(ids: string[]) { this.ids = [...ids]; }
  execute(state: DiagramState) {
    return { state: { ...state, selection: [...this.ids] } };
  }
  invert(prev: DiagramState) { return new SetSelection(prev.selection); }
}

export interface UpdateNodePropsPayload {
  id: string;
  changes: Partial<Pick<DiagramNode, 'type' | 'data'>> & { data?: Record<string, unknown> };
}

export class UpdateNodeProps implements Command {
  name = 'updateNodeProps';
  private payload: UpdateNodePropsPayload;
  constructor(payload: UpdateNodePropsPayload) { this.payload = payload; }
  execute(state: DiagramState) {
    const { id, changes } = this.payload;
    const nodes = state.nodes.map(n => {
      if (n.id !== id) return n;
      const mergedData = changes.data ? { ...(n.data || {}), ...changes.data } : n.data;
      return { ...n, ...changes, data: mergedData };
    });
    return { state: { ...state, nodes } };
  }
  invert(prev: DiagramState, next: DiagramState) {
    const before = prev.nodes.find(n => n.id === this.payload.id);
    const after = next.nodes.find(n => n.id === this.payload.id);
    if (!before || !after) return undefined;
    const diff: any = {};
    (['type','data'] as const).forEach(k => {
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) diff[k] = before[k];
    });
    return new UpdateNodeProps({ id: this.payload.id, changes: diff });
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
