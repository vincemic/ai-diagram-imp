export async function exportCurrentViewAsJPEG(container: HTMLElement, filename = 'diagram.jpg', quality = 0.92) {
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('SVG root not found');
  const serializer = new XMLSerializer();
  const svgText = serializer.serializeToString(svg);
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
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.drawImage(img, 0, 0);
    const blobOut: Blob = await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), 'image/jpeg', quality));
    const a = document.createElement('a');
    a.download = filename;
    a.href = URL.createObjectURL(blobOut);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } finally {
    URL.revokeObjectURL(url);
  }
}
