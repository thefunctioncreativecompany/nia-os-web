import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { fetchImage, safeSharp } = await import("./fetch-image");

// A small picture, and a PNG that claims to be 20,000 × 20,000 (400 megapixels) in its header.
const tiny = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#808080" } }).png().toBuffer();
const bomb = Buffer.from(tiny);
bomb.writeUInt32BE(20_000, 16);
bomb.writeUInt32BE(20_000, 20);

let server: Server;
let base = "";
beforeAll(async () => {
  server = createServer((req, res) => {
    switch (req.url) {
      case "/ok.png":
        return res.writeHead(200, { "Content-Type": "image/png" }).end(tiny);
      case "/text":
        return res.writeHead(200, { "Content-Type": "text/html" }).end("<html>");
      case "/big-stated":
        return res.writeHead(200, { "Content-Type": "image/png", "Content-Length": String(2048) }).end(Buffer.alloc(2048));
      case "/big-unstated": {
        // No stated size: sent in pieces until the reader gives up.
        res.writeHead(200, { "Content-Type": "image/png", "Transfer-Encoding": "chunked" });
        let sent = 0;
        const more = () => {
          while (sent < 64 * 1024) {
            sent += 1024;
            if (!res.write(Buffer.alloc(1024))) return res.once("drain", more);
          }
          res.end();
        };
        return more();
      }
      case "/redirect":
        return res.writeHead(302, { Location: "/ok.png" }).end();
      default:
        return res.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

describe("fetchImage", () => {
  it("downloads a picture", async () => {
    expect((await fetchImage(`${base}/ok.png`))?.equals(tiny)).toBe(true);
  });
  it("refuses what isn't a picture", async () => {
    expect(await fetchImage(`${base}/text`)).toBeNull();
  });
  it("refuses a picture over the cap by its stated size", async () => {
    expect(await fetchImage(`${base}/big-stated`, { maxBytes: 1024 })).toBeNull();
  });
  it("stops reading once a picture with no stated size passes the cap", async () => {
    expect(await fetchImage(`${base}/big-unstated`, { maxBytes: 4096 })).toBeNull();
  });
  it("refuses redirects unless the caller checks where they land", async () => {
    expect(await fetchImage(`${base}/redirect`)).toBeNull();
    expect(await fetchImage(`${base}/redirect`, { landedOn: (u) => u.pathname === "/ok.png" })).not.toBeNull();
    expect(await fetchImage(`${base}/redirect`, { landedOn: () => false })).toBeNull();
  });
  it("refuses a missing picture", async () => {
    expect(await fetchImage(`${base}/missing.png`)).toBeNull();
  });
});

describe("safeSharp", () => {
  it("reads an ordinary picture", async () => {
    expect((await safeSharp(tiny).metadata()).width).toBe(4);
  });
  it("refuses a picture that claims to be enormous, before decoding it", async () => {
    await expect(safeSharp(bomb).resize({ width: 64 }).toBuffer()).rejects.toThrow(/pixel limit/i);
  });
});
