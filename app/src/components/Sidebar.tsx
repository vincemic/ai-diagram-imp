import React, { useEffect } from 'react';
import { useDiagramStore, selectDiagramState } from '../core/store.js';
import { PropertyPane } from './PropertyPane.js';

export const Sidebar: React.FC = () => {
  const state = useDiagramStore(selectDiagramState);
  const hasSelection = state.selection.length > 0;

  // Reflect open state on parent workspace for layout CSS
  useEffect(() => {
    const workspace = document.querySelector('.workspace');
    if (!workspace) return;
    if (hasSelection) {
      workspace.setAttribute('data-sidebar-open', 'true');
    } else {
      workspace.setAttribute('data-sidebar-open', 'false');
    }
  }, [hasSelection]);

  return (
    <aside
      className="sidebar"
      data-testid="sidebar"
      data-selection-count={state.selection.length}
      aria-label="Properties sidebar"
      aria-expanded={hasSelection ? true : false}
    >
      <div
        className={"sidebar-panel" + (hasSelection ? ' is-open' : ' is-closed')}
        data-testid="sidebar-panel"
        aria-hidden={hasSelection ? false : true}
      >
        <h2 className="sidebar-title">Properties</h2>
        <div className="property-pane-slide-container">
          <div
            className="property-pane-shell"
            data-testid="property-pane-shell"
            data-pane-active={hasSelection ? '1' : '0'}
          >
            <PropertyPane active={hasSelection} />
          </div>
        </div>
      </div>
      {!hasSelection && (
        <div className="sidebar-placeholder" data-testid="property-pane-empty">No selection</div>
      )}
    </aside>
  );
};
