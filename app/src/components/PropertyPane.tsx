import React, { useCallback, useRef } from 'react';
import { useDiagramStore, selectDiagramState, selectDispatch } from '../core/store.js';
import { UpdateNodeProps } from '../core/commands.js';

export const PropertyPane: React.FC = () => {
  const state = useDiagramStore(selectDiagramState);
  const dispatch = useDiagramStore(selectDispatch);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const selectedId = state.selection[0];
  const node = state.nodes.find(n => n.id === selectedId);
  if (!node) return null;

  const data = (node.data || {}) as any;

  const update = useCallback((changes: { type?: string; text?: string; textColor?: string; backgroundColor?: string; shape?: string; }) => {
    const newData: Record<string, unknown> = { ...data };
    if (changes.text !== undefined) newData.text = changes.text;
    if (changes.textColor !== undefined) newData.textColor = changes.textColor;
    if (changes.backgroundColor !== undefined) newData.backgroundColor = changes.backgroundColor;
    if (changes.shape !== undefined) newData.shape = changes.shape;
    const typeChange = changes.type ? { type: changes.type } : {};
    dispatch(new UpdateNodeProps({ id: node.id, changes: { ...typeChange, data: newData } }));
  }, [dispatch, node.id, data]);

  return (
    <div className="property-pane" data-testid="property-pane">
      <fieldset>
        <legend>Content</legend>
        <label>
           Text
           <input
             ref={textInputRef}
             type="text"
             value={data.text !== undefined ? data.text : node.type}
             placeholder={node.type}
             onChange={(e) => update({ text: e.target.value })}
           />
        </label>
        <label>
          Shape
          <select value={data.shape || 'rect'} onChange={e => update({ shape: e.target.value })}>
            <option value="rect">Rectangle</option>
            <option value="rounded">Rounded</option>
            <option value="ellipse">Ellipse</option>
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Colors</legend>
        <label>
          Text Color
          <input type="color" value={data.textColor || '#e0e6ed'} onChange={e => update({ textColor: e.target.value })} />
        </label>
        <label>
          Background Color
          <input type="color" value={data.backgroundColor || '#2e3742'} onChange={e => update({ backgroundColor: e.target.value })} />
        </label>
      </fieldset>
    </div>
  );
};
