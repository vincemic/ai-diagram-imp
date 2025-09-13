import React, { useRef } from 'react';
import { useDiagramStore, selectDispatch, selectManager } from '../core/store.js';
import { ReplaceState, AddNode } from '../core/commands.js';
import { toGraphML, fromGraphML } from '../core/graphml.js';
import { validateDiagram } from '../model/validateDiagram.js';
import { exportCurrentViewAsJPEG, exportCurrentViewAsPNG } from '../core/exportJPEG.js';
import { updatePreferences } from '../core/preferences.js';
import { HamburgerMenu } from './HamburgerMenu.js';

export const Toolbar: React.FC = () => {
  const dispatch = useDiagramStore(selectDispatch);
  const manager = useDiagramStore(selectManager);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const undo = useDiagramStore(s => s.undo);
  const redo = useDiagramStore(s => s.redo);
  const [edgeArrow, setEdgeArrow] = React.useState<'none'|'standard'|'circle'|'diamond'|'tee'>('standard');
  React.useEffect(() => {
    (window as any).__defaultEdgeArrow = edgeArrow;
  }, [edgeArrow]);

  // Keyboard shortcuts for undo/redo
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (mod && (e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handleNew = () => {
  dispatch(new ReplaceState({ schemaVersion: '1.1.0', nodes: [], edges: [], selection: [], metadata: { title: 'Untitled Diagram' } } as any));
    updatePreferences(p => ({ ...p, lastOpenedTitle: 'Untitled Diagram' }));
  };
  const handleAddNode = () => {
    dispatch(new AddNode({ x: 100, y: 80, type: 'start' }));
  };

  const handleExportJSON = () => {
    const data = manager.state;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.download = (data.metadata?.title || 'diagram') + '.json';
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const handleExportJPEG = async () => {
    const container = document.getElementById('diagram-container');
    if (!container) return;
    await exportCurrentViewAsJPEG(container, (manager.state.metadata?.title || 'diagram') + '.jpg');
  };
  const handleExportPNG = async () => {
    const container = document.getElementById('diagram-container');
    if (!container) return;
    await exportCurrentViewAsPNG(container, (manager.state.metadata?.title || 'diagram') + '.png');
  };

  const handleImportClick = () => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const json = JSON.parse(text);
              const result = validateDiagram(json);
              if (result.valid) {
                dispatch(new ReplaceState(json));
                if (json?.metadata?.title) updatePreferences(p => ({ ...p, lastOpenedTitle: json.metadata.title }));
              } else {
                alert('Invalid diagram JSON. See console for details.');
                console.error('Validation errors', result.errors);
          }
        } catch (e) {
          alert('Failed to import diagram JSON');
          console.error(e);
        }
      };
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  };

  const handleExportGraphML = () => {
    const xml = toGraphML(manager.state);
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = document.createElement('a');
    a.download = (manager.state.metadata?.title || 'diagram') + '.graphml';
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  const handleImportGraphML = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.graphml,application/xml,text/xml';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const { diagram, warnings } = fromGraphML(text);
        const result = validateDiagram(diagram);
        if (result.valid) {
          dispatch(new ReplaceState(diagram));
          if (diagram?.metadata?.title) updatePreferences(p => ({ ...p, lastOpenedTitle: diagram.metadata.title }));
          if (warnings.length) {
            console.warn('GraphML import warnings:', warnings);
            alert('Imported with warnings. See console for details.');
          }
        } else {
          alert('Imported GraphML failed validation. See console.');
          console.error('Validation errors', result.errors);
        }
      } catch (e) {
        alert('Failed to import GraphML');
        console.error(e);
      }
    };
    input.click();
  };

  return (
    <div className="toolbar" data-testid="toolbar">
      <HamburgerMenu>
        <button type="button" onClick={handleNew}>New</button>
        <button type="button" onClick={handleImportClick}>Import</button>
  <button type="button" onClick={handleExportJSON}>Export JSON</button>
  <button type="button" onClick={handleExportGraphML}>Export GraphML (Beta)</button>
  <button type="button" onClick={handleImportGraphML}>Import GraphML (Beta)</button>
        <button type="button" onClick={handleExportPNG}>Export PNG</button>
        <button type="button" onClick={handleExportJPEG}>Export JPEG</button>
      </HamburgerMenu>
      <button type="button" onClick={handleAddNode}
        className="toolbar-new-node"
        data-testid="add-node-inline"
      >New Node</button>
      <span className="toolbar-spacer" />
      <a
        href="https://github.com/vincemic/ai-diagram-imp"
        className="toolbar-gh-link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open project on GitHub"
        title="GitHub Repository"
      >
        {/* Simple GitHub mark (octocat silhouette simplified) */}
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.64 7.64 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
        </svg>
      </a>
      <div className="toolbar-inline-actions">
        <button type="button" onClick={() => { undo(); }}>Undo</button>
        <button type="button" onClick={() => { redo(); }}>Redo</button>
        <label className="edge-arrow-select">
          <span className="edge-arrow-label">Arrow</span>
          <select value={edgeArrow} onChange={e => setEdgeArrow(e.target.value as any)}>
            <option value="none">None</option>
            <option value="standard">Standard</option>
            <option value="circle">Circle</option>
            <option value="diamond">Diamond</option>
            <option value="tee">Tee</option>
          </select>
        </label>
      </div>
    </div>
  );
};
