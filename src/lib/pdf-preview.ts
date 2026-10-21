async function pdfjs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  return lib;
}

// Pictures of every page of a PDF, `width` pixels wide (the document editor's live preview,
// Ika 2026-10-21). pdf.js loads the first time it's needed. Throws if the PDF can't be read.
export async function pdfPages(file: Blob, width: number): Promise<Blob[]> {
  const lib = await pdfjs();
  const task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const pdf = await task.promise;
    const pages: Blob[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvas, viewport, background: "white" }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (blob) pages.push(blob);
    }
    return pages;
  } finally {
    void task.destroy();
  }
}

// A picture of a PDF's first page, drawn in the browser with pdf.js when the file is uploaded,
// used as the document's cover in a project's files (Ika, 2026-10-19). pdf.js loads only when a
// PDF is uploaded. Returns null if the PDF can't be read (locked or damaged).
export async function pdfFirstPage(file: Blob, width = 640): Promise<Blob | null> {
  try {
    const lib = await pdfjs();
    const task = lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport, background: "white" }).promise;
    void task.destroy();
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } catch {
    return null;
  }
}
