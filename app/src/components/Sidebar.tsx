import React from 'react';
import { useDiagramStore, selectDiagramState } from '../core/store.js';
import { PropertyPane } from './PropertyPane.js';

export const Sidebar: React.FC = () => {
  const state = useDiagramStore(selectDiagramState);
  const hasSelection = state.selection.length > 0;
  return (
    <aside className="sidebar" data-testid="sidebar">
      <h2>Properties</h2>
      {hasSelection ? <PropertyPane /> : <div>No selection</div>}
    </aside>
  );
};
