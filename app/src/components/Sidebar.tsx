import React from 'react';
import { useDiagramStore, selectDiagramState } from '../core/store.js';
import { PropertyPane } from './PropertyPane.js';

export const Sidebar: React.FC = () => {
  const state = useDiagramStore(selectDiagramState);
  const hasSelection = state.selection.length > 0;

  return (
  <aside className="sidebar" data-testid="sidebar" data-selection-count={state.selection.length}>
      <h2>Properties</h2>
      <div className="property-pane-slide-container">
        <div
          className={"property-pane-shell" + (hasSelection ? '' : ' is-hidden')}
          data-testid="property-pane-shell"
          aria-hidden={hasSelection ? 'false' : 'true'}
          data-pane-active={hasSelection ? '1' : '0'}
        >
          <PropertyPane active={hasSelection} />
        </div>
        {!hasSelection && <div className="property-pane-empty" data-testid="property-pane-empty">No selection</div>}
      </div>
    </aside>
  );
};
