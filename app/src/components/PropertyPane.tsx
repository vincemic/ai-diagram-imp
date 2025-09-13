import React, { useCallback, useRef, useEffect } from 'react';
import { useDiagramStore, selectDiagramState, selectDispatch } from '../core/store.js';
import { UpdateNodeProps } from '../core/commands.js';

interface PropertyPaneProps { active: boolean; }

export const PropertyPane: React.FC<PropertyPaneProps> = ({ active }) => {
  const state = useDiagramStore(selectDiagramState);
  const dispatch = useDiagramStore(selectDispatch);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const selectedId = state.selection[0];
  const node = state.nodes.find(n => n.id === selectedId);
  const data = (node?.data || {}) as any;

  const update = useCallback((changes: { type?: string; text?: string; textColor?: string; backgroundColor?: string; shape?: string; }) => {
    if (!node) return;
    const newData: Record<string, unknown> = { ...data };
    if (changes.text !== undefined) newData.text = changes.text;
    if (changes.textColor !== undefined) newData.textColor = changes.textColor;
    if (changes.backgroundColor !== undefined) newData.backgroundColor = changes.backgroundColor;
    if (changes.shape !== undefined) newData.shape = changes.shape;
    const typeChange = changes.type ? { type: changes.type } : {};
    dispatch(new UpdateNodeProps({ id: node.id, changes: { ...typeChange, data: newData } }));
  }, [dispatch, node, data]);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Focus trap when pane active
  useEffect(() => {
    if (!active || !node) return;
    const el = containerRef.current;
    if (!el) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(el.querySelectorAll<HTMLElement>('input, select, button, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(f => !f.hasAttribute('disabled') && f.tabIndex !== -1);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const activeEl = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (activeEl === first || !el.contains(activeEl)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (activeEl === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    el.addEventListener('keydown', handleKey);
    return () => el.removeEventListener('keydown', handleKey);
  }, [active, node]);

  return (
  <div ref={containerRef} className="property-pane" data-testid="property-pane" aria-hidden={(!active || !node)}>
      {node && (
        <>
          <fieldset>
            <legend>Content</legend>
            <label>
              Text
              <input
                data-testid="prop-text"
                ref={textInputRef}
                type="text"
                value={data.text !== undefined ? data.text : node.type}
                placeholder={node.type}
                onChange={(e) => update({ text: e.target.value })}
              />
            </label>
            <label>
              Shape
              <select data-testid="prop-shape" value={data.shape || 'rect'} onChange={e => update({ shape: e.target.value })}>
                <option value="rect">Rectangle</option>
                <option value="square">Square</option>
                <option value="rounded">Rounded</option>
                <option value="ellipse">Ellipse</option>
                <option value="triangle">Triangle</option>
                <option value="star">Star</option>
              </select>
            </label>
          </fieldset>
          <fieldset>
            <legend>Colors</legend>
            <label>
              Text Color
              <input data-testid="prop-text-color" type="color" value={data.textColor || '#000000'} onChange={e => update({ textColor: e.target.value })} />
            </label>
            <label>
              Background Color
              <input data-testid="prop-bg-color" type="color" value={data.backgroundColor || '#ADD8E6'} onChange={e => update({ backgroundColor: e.target.value })} />
            </label>
          </fieldset>
        </>
      )}
    </div>
  );
};
