// parsePlayer.js
// Browser-safe version of your Node plrParser.js

function readInt(view, offset) {
  return view.getInt32(offset, true);
}

// 7-bit encoded string reader (BinaryReader style)
function readTString(view, bytes, offset) {
  let length = 0;
  let shift = 0;
  let pos = offset;

  while (true) {
    if (pos >= bytes.length) return null;
    const b = bytes[pos++];
    length |= (b & 0x7F) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
    if (shift > 28) return null;
  }

  if (length <= 0 || pos + length > bytes.length) return null;

  const slice = bytes.slice(pos, pos + length);
  const text = new TextDecoder("utf-8").decode(slice);

  return { text, size: (pos - offset) + length };
}

// Same normalization as your Node parser
function normalizeName(name) {
  return name.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

export function parsePlayerFile(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);

  let bestBlock = { offset: 0, research: [] };

  for (let i = 0; i < bytes.length - 16; i++) {
    let offset = i;
    const entries = [];

    while (true) {
      const str = readTString(view, bytes, offset);
      if (!str) break;

      const name = str.text;
      offset += str.size;

      if (offset + 4 > bytes.length) break;
      const count = readInt(view, offset);
      offset += 4;

      if (!name || name.length < 2) break;

      const core = normalizeName(name);
      if (!core || core.length < 2) break;
      if (count < 0 || count > 9999) break;

      entries.push({ name: core, count });
    }

    if (entries.length > bestBlock.research.length) {
      bestBlock = { offset: i, research: entries };
    }
  }

  const researchMap = {};
  for (const e of bestBlock.research) {
    researchMap[e.name] = e.count;
  }

  return { research: researchMap };
}
