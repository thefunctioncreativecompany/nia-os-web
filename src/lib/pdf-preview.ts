// A picture of a PDF's first page, drawn in the browser with pdf.js when the file is uploaded,
// used as the document's cover in a project's files (Ika, 2026-10-19). pdf.js loads only when a
// PDF is uploaded. Returns null if the PDF can't be read (locked or damaged).
export async function pdfFirstPage(file: Blob, width = 640): Promise<Blob | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
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
