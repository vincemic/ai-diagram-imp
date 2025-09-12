import React from 'react';
import { Toolbar } from './Toolbar.js';
import { Sidebar } from './Sidebar.js';
import { DiagramCanvas } from './DiagramCanvas.js';

export const App: React.FC = () => {
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
