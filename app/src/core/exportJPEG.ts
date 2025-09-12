/**
 * Internal: clone the SVG and inline computed styles so that when serialized
 * and rendered in an <img>, colors / text styles are preserved without external CSS.
 */
function cloneSvgWithInlineStyles(original: SVGSVGElement): SVGSVGElement {
  const clone = original.cloneNode(true) as SVGSVGElement;
  const origElems = original.querySelectorAll<HTMLElement | SVGGraphicsElement>('*');
  const cloneElems = clone.querySelectorAll<HTMLElement | SVGGraphicsElement>('*');
  const PROPS = [
    'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray',
    'font-size', 'font-family', 'font-weight', 'font-style', 'dominant-baseline', 'text-anchor', 'opacity'
  ];
  for (let i = 0; i < origElems.length; i++) {
    const o = origElems[i];
    const c = cloneElems[i];
    if (!o || !c) continue;
    const cs = window.getComputedStyle(o as Element);
    PROPS.forEach(p => {
      const val = cs.getPropertyValue(p);
      if (val && val !== 'none' && val.trim() !== '') {
        c.setAttribute(p, val);
      }
    });
  }
  // Ensure xmlns present
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  // Inject a background rect if original had a background color via CSS
  const svgBg = window.getComputedStyle(original).getPropertyValue('background-color');
  if (svgBg && svgBg !== 'rgba(0, 0, 0, 0)' && svgBg !== 'transparent') {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', String(original.viewBox.baseVal?.width || original.width.baseVal?.value || original.getBoundingClientRect().width));
    rect.setAttribute('height', String(original.viewBox.baseVal?.height || original.height.baseVal?.value || original.getBoundingClientRect().height));
    rect.setAttribute('fill', svgBg);
    clone.insertBefore(rect, clone.firstChild);
  }
  return clone;
}

interface ExportOptions {
  filename?: string;
  quality?: number; // JPEG quality
  scale?: number;   // Multiplier for resolution
  backgroundColor?: string; // Override background color
}

async function exportCurrentView(container: HTMLElement, type: 'image/jpeg' | 'image/png', opts: ExportOptions = {}) {
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('SVG root not found');
  const clone = cloneSvgWithInlineStyles(svg);
  // Override background if specified
  if (opts.backgroundColor) {
    const existingBgRect = clone.querySelector(':scope > rect');
    if (existingBgRect) existingBgRect.setAttribute('fill', opts.backgroundColor);
  }
  const serializer = new XMLSerializer();
  const svgText = serializer.serializeToString(clone);
  const blob = new Blob([svgText], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    const rect = svg.getBoundingClientRect();
    img.width = rect.width;
    img.height = rect.height;
    const load = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
    });
    img.src = url;
    await load;
    const scale = opts.scale ?? devicePixelRatio;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(rect.width * scale));
    canvas.height = Math.max(1, Math.round(rect.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.scale(scale, scale);
    // If background override specified and we did not earlier insert (or to ensure), fill canvas first
    if (opts.backgroundColor) {
      ctx.fillStyle = opts.backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    ctx.drawImage(img, 0, 0);
    const blobOut: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to create image blob')), type, opts.quality ?? 0.92);
    });
    const a = document.createElement('a');
    a.download = opts.filename || (type === 'image/png' ? 'diagram.png' : 'diagram.jpg');
    a.href = URL.createObjectURL(blobOut);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportCurrentViewAsJPEG(container: HTMLElement, filename = 'diagram.jpg', quality = 0.92) {
  await exportCurrentView(container, 'image/jpeg', { filename, quality });
}

export async function exportCurrentViewAsPNG(container: HTMLElement, filename = 'diagram.png', scale?: number) {
  await exportCurrentView(container, 'image/png', { filename, scale });
}
