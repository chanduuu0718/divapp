import "dotenv/config";
import express from "express";
import cors from "cors";
import { extractProduct } from "./services/productService.js";
import { createPosterDesign } from "./services/aiDesignService.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "poster-ai-backend" });
});

app.post("/api/product", async (req, res) => {
  try {
    const url = String(req.body?.url || "").trim();
    if (!url) return res.status(400).json({ error: "Product URL is required." });

    const product = await extractProduct(url);
    res.json(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read this product page.";
    res.status(422).json({ error: message });
  }
});

app.post("/api/poster/design", async (req, res) => {
  try {
    const { product, style = "AI Pick" } = req.body || {};
    if (!product?.name) return res.status(400).json({ error: "Product data is required." });

    const design = await createPosterDesign(product, style);
    res.json(design);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the poster design.";
    res.status(500).json({ error: message });
  }
});

// Proxy product images so the browser can safely compose a downloadable PNG.
app.get("/api/image", async (req, res) => {
  try {
    const source = String(req.query.url || "");
    const parsed = new URL(source);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid image URL.");

    const response = await fetch(parsed, {
      headers: { "User-Agent": "PosterAI/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error("Image could not be fetched.");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) throw new Error("URL is not an image.");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(400).json({ error: "Unable to proxy image." });
  }
});

app.listen(port, () => {
  console.log(`Poster AI backend running on http://localhost:${port}`);
});