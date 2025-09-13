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
    dispatch(new ReplaceState({ schemaVersion: '1.0.0', nodes: [], edges: [], selection: [], metadata: { title: 'Untitled Diagram' } } as any));
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
      <div className="toolbar-inline-actions">
        <button type="button" onClick={() => { undo(); }}>Undo</button>
        <button type="button" onClick={() => { redo(); }}>Redo</button>
      </div>
    </div>
  );
};
