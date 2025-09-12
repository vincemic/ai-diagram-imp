import { create } from 'zustand';
import { CommandManager, initialState, Command, DiagramState } from './commands.js';

export interface StoreState {
  manager: CommandManager;
  dispatch: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  getStateSnapshot: () => DiagramState;
}

export const useDiagramStore = create<StoreState>((set, get) => {
  const manager = new CommandManager(initialState);
  return {
    manager,
    dispatch: (cmd) => {
      manager.dispatch(cmd);
      set({});
    },
    undo: () => { manager.undo(); set({}); },
    redo: () => { manager.redo(); set({}); },
    getStateSnapshot: () => manager.state
  };
});

// Convenience typed selectors
export const selectManager = (s: StoreState) => s.manager;
export const selectDispatch = (s: StoreState) => s.dispatch;
export const selectDiagramState = (s: StoreState) => s.manager.state;
