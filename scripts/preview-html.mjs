/** A portable preview must retain the document's real mobile viewport contract. */
export function assertResponsiveViewport(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  const tags = head?.match(/<meta\b[^>]*>/gi) ?? [];
  const viewports = tags.filter(tag => /\bname\s*=\s*["']viewport["']/i.test(tag));
  if (viewports.length !== 1) throw new Error('Preview requires exactly one viewport meta tag in its head.');
  const content = viewports[0].match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2] ?? '';
  const settings = Object.fromEntries(content.split(',').map(part => part.trim().toLowerCase().split(/\s*=\s*/)));
  if (settings.width !== 'device-width' || settings['initial-scale'] !== '1')
    throw new Error('Preview must use width=device-width, initial-scale=1.');
  if ('maximum-scale' in settings || settings['user-scalable'] === 'no' || settings['user-scalable'] === '0')
    throw new Error('Preview must preserve user zoom.');
}

export function inlinePreview(html, javascript, css) {
  assertResponsiveViewport(html);
  const script = /<script type="module" crossorigin src="[^"]+"><\/script>/;
  const stylesheet = /<link rel="stylesheet" crossorigin href="[^"]+">/;
  if (!script.test(html) || !stylesheet.test(html))
    throw new Error('Build output structure changed; review the standalone bundling step.');
  const result = html
    .replace(script, () => `<script type="module">${javascript.replaceAll('</script', '<\\/script')}</script>`)
    .replace(stylesheet, () => `<style>${css}</style>`)
    .replace(/<link rel="icon"[^>]+>/g, '');
  assertResponsiveViewport(result);
  return result;
}
