import { serialize } from './layout.js';

// Sharing a layout: the whole board is packed into the link itself, after "#layout=".
// Nothing is uploaded anywhere; whoever opens the link gets their own copy to play with.
const PREFIX = '#layout=';

const toB64 = bytes => { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const fromB64 = str => { const s = atob(str.replace(/-/g, '+').replace(/_/g, '/')); const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; };

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

// "z..." is deflated JSON, "j..." is plain JSON for browsers without CompressionStream.
export async function encodeLayout(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  if (typeof CompressionStream === 'function') {
    try { return 'z' + toB64(await pipe(bytes, new CompressionStream('deflate-raw'))); } catch (e) { /* fall through */ }
  }
  return 'j' + toB64(bytes);
}

export async function decodeLayout(code) {
  let bytes = fromB64(code.slice(1));
  if (code[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!data || !Array.isArray(data.pieces)) throw new Error('not a layout');
  return data;
}

export async function shareLink() {
  return location.origin + location.pathname + PREFIX + await encodeLayout(serialize());
}

// The layout carried by the address this page was opened with, if any.
export async function layoutFromAddress() {
  if (!location.hash.startsWith(PREFIX)) return null;
  try { return await decodeLayout(location.hash.slice(PREFIX.length)); } catch (e) { return undefined; }
}

export function clearAddress() {
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
}
