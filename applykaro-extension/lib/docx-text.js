// Dependency-free .docx → plain text extractor.
// A .docx is a ZIP archive; the document body lives in word/document.xml.
// Uses the native DecompressionStream API (Chrome 80+) — no external libs,
// so it stays within the MV3 default CSP (no eval / unsafe-eval needed).
// We only need the raw text for AI parsing, not formatting fidelity.

(function () {
  const EOCD_SIG = 0x06054b50; // End Of Central Directory record
  const CEN_SIG = 0x02014b50; // Central directory file header
  const TARGET = "word/document.xml";

  async function inflateRaw(bytes) {
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Response(new Blob([bytes])).body.pipeThrough(ds);
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
  }

  // Locate the target entry by walking the ZIP central directory.
  function findEntry(view, targetName) {
    const len = view.byteLength;
    let eocd = -1;
    for (let i = len - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === EOCD_SIG) {
        eocd = i;
        break;
      }
    }
    if (eocd === -1) throw new Error("Not a valid DOCX file.");

    const count = view.getUint16(eocd + 10, true);
    let ptr = view.getUint32(eocd + 16, true);
    const decoder = new TextDecoder("utf-8");

    for (let n = 0; n < count; n++) {
      if (view.getUint32(ptr, true) !== CEN_SIG) break;
      const method = view.getUint16(ptr + 10, true);
      const compSize = view.getUint32(ptr + 20, true);
      const fnLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localOff = view.getUint32(ptr + 42, true);
      const nameBytes = new Uint8Array(view.buffer, view.byteOffset + ptr + 46, fnLen);
      if (decoder.decode(nameBytes) === targetName) {
        return { method, compSize, localOff };
      }
      ptr += 46 + fnLen + extraLen + commentLen;
    }
    throw new Error("Could not find document body in DOCX.");
  }

  async function readEntry(buffer, entry) {
    const view = new DataView(buffer);
    // Local file header is 30 bytes + filename + extra, then the data.
    const fnLen = view.getUint16(entry.localOff + 26, true);
    const extraLen = view.getUint16(entry.localOff + 28, true);
    const dataStart = entry.localOff + 30 + fnLen + extraLen;
    const compressed = new Uint8Array(buffer, dataStart, entry.compSize);

    if (entry.method === 0) return compressed; // stored
    if (entry.method === 8) return await inflateRaw(compressed); // deflate
    throw new Error("Unsupported DOCX compression method.");
  }

  function xmlToText(xml) {
    return xml
      .replace(/<w:tab\b[^>]*\/?>/g, "\t")
      .replace(/<w:br\b[^>]*\/?>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async function extractDocxText(file) {
    const buffer = await file.arrayBuffer();
    const entry = findEntry(new DataView(buffer), TARGET);
    const xmlBytes = await readEntry(buffer, entry);
    const xml = new TextDecoder("utf-8").decode(xmlBytes);
    return xmlToText(xml);
  }

  window.extractDocxText = extractDocxText;
})();
