import React, { useEffect } from 'react';
import { useDiagramStore, selectDiagramState, selectDispatch } from '../core/store.js';
import { MoveNode, RemoveNode, SetSelection } from '../core/commands.js';

// Keyboard shortcuts & navigation behaviors:
// - Tab / Shift+Tab: cycle through nodes in insertion order (state.nodes) updating single selection.
// - Arrow keys: nudge currently selected node by 10px (with Ctrl/Cmd by 1px for fine adjustment).
// - Delete / Backspace: remove currently selected node.
// - Escape: clear selection.
// - Enter or F2: focus the Text input inside the Property Pane (if a node selected).
//   This component attempts to be resilient; if focus is inside a form element, most shortcuts are ignored.

export const KeyboardShortcuts: React.FC = () => {
  const state = useDiagramStore(selectDiagramState);
  const dispatch = useDiagramStore(selectDispatch);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const tag = active?.tagName.toLowerCase();
      const isTypingContext = active && (active.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');

      // Allow Esc even when typing (to exit selection), others suppressed while typing.
      if (isTypingContext && e.key !== 'Escape') return;

      const nodes = state.nodes;
      const selection = state.selection;
      const selectedId = selection[0];
      const selectedIndex = nodes.findIndex(n => n.id === selectedId);

      // Cycling selection with Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        if (!nodes.length) return;
        const dir = e.shiftKey ? -1 : 1;
        let nextIndex = selectedIndex;
        if (nextIndex === -1) {
          nextIndex = dir > 0 ? 0 : nodes.length - 1;
        } else {
          nextIndex = (nextIndex + dir + nodes.length) % nodes.length;
        }
        dispatch(new SetSelection([nodes[nextIndex].id]));
        return;
      }

      // Escape clears selection
      if (e.key === 'Escape') {
        if (selection.length) {
          dispatch(new SetSelection([]));
          e.preventDefault();
        }
        return;
      }

      if (selectedIndex === -1) return; // nothing selected for remaining shortcuts

      // Enter / F2 -> focus Text input in property pane
      if (e.key === 'Enter' || e.key === 'F2') {
        const textInput = document.querySelector('[data-testid="property-pane"] label:has(> input[type="text"]) input[type="text"]') as HTMLInputElement | null;
        if (textInput) {
          textInput.focus();
          textInput.select();
          e.preventDefault();
        }
        return;
      }

      const node = nodes[selectedIndex];
      // Delete / Backspace remove node (avoid Backspace navigating browser)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        dispatch(new RemoveNode(node.id));
        dispatch(new SetSelection([]));
        e.preventDefault();
        return;
      }

      // Arrow keys nudge
      const fine = e.metaKey || e.ctrlKey; // fine movement if meta/ctrl pressed
      const delta = fine ? 1 : 10;
      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowLeft': dx = -delta; break;
        case 'ArrowRight': dx = delta; break;
        case 'ArrowUp': dy = -delta; break;
        case 'ArrowDown': dy = delta; break;
      }
      if (dx !== 0 || dy !== 0) {
        dispatch(new MoveNode(node.id, node.x + dx, node.y + dy));
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, dispatch]);

  return null;
};

export default KeyboardShortcuts;