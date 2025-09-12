import React, { useEffect } from 'react';
import { Toolbar } from './Toolbar.js';
import { Sidebar } from './Sidebar.js';
import { DiagramCanvas } from './DiagramCanvas.js';
import { useDiagramStore, selectDispatch } from '../core/store.js';
import { ReplaceState } from '../core/commands.js';

// Load example diagram if ?example=<key> is present.
const useExampleLoader = () => {
  const dispatch = useDiagramStore(selectDispatch);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ex = params.get('example');
    if (!ex) return;
    (async () => {
      try {
        const { examples } = await import('../model/examples.js');
        const diagram = examples[ex];
        if (diagram) {
          dispatch(new ReplaceState(diagram));
        } else {
          // eslint-disable-next-line no-console
          console.warn('Unknown example diagram key:', ex);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load example diagram', e);
      }
    })();
  }, [dispatch]);
};

export const App: React.FC = () => {
  useExampleLoader();
  return (
    <div className="app-root">
      <Toolbar />
      <div className="workspace">
        <Sidebar />
        <DiagramCanvas />
      </div>
    </div>
  );
};
