import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  Image as ImageIcon,
  Link2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type ProductImage = { url: string; alt: string };
type Product = {
  sourceUrl: string;
  name: string;
  price: string;
  currency: string;
  category: string;
  images: ProductImage[];
};
type Design = {
  headline: string;
  subheadline: string;
  badge: string;
  cta: string;
  accent: string;
  background: string;
  text: string;
};

const styles = ["AI Pick", "Premium", "Minimal", "Bold", "Luxury"];

export default function App() {
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [style, setStyle] = useState("AI Pick");
  const [design, setDesign] = useState<Design | null>(null);
  const [error, setError] = useState("");

  const canAnalyze = useMemo(() => /^https?:\\/\\//i.test(url.trim()), [url]);

  async function analyzeLink() {
    if (!canAnalyze) return;
    setLoading(true);
    setError("");
    setProduct(null);
    setGenerated(false);

    try {
      const response = await fetch("/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not read this product.");
      setProduct(data);
      setSelected(data.images.slice(0, Math.min(2, data.images.length)).map((_: ProductImage, i: number) => i));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this product link.");
    } finally {
      setLoading(false);
    }
  }

  function toggleImage(index: number) {
    setSelected((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index]
    );
    setGenerated(false);
  }

  async function generatePoster() {
    if (!product || selected.length === 0) return;
    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/poster/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, style }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Poster design failed.");
      setDesign(data);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Poster generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPoster() {
    if (!product || !design || selected.length === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = design.background || "#17171b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createRadialGradient(850, 430, 40, 850, 430, 430);
    gradient.addColorStop(0, design.accent || "#6b5cff");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = gradient;
    ctx.fillRect(450, 0, 630, 850);
    ctx.globalAlpha = 1;

    ctx.fillStyle = design.text || "#fff";
    ctx.font = "800 26px Inter, Arial, sans-serif";
    ctx.fillText((design.badge || "FEATURED").toUpperCase().slice(0, 18), 76, 100);

    ctx.font = "800 72px Inter, Arial, sans-serif";
    const words = (design.headline || product.name).split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > 900 && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((text, i) => ctx.fillText(text, 76, 205 + i * 78));

    ctx.font = "400 30px Inter, Arial, sans-serif";
    ctx.globalAlpha = 0.72;
    ctx.fillText((design.subheadline || "").slice(0, 55), 76, 455);
    ctx.globalAlpha = 1;

    const imageUrl = "/api/image?url=" + encodeURIComponent(product.images[selected[0]].url);
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The selected product image could not be loaded."));
    });

    const maxW = 900;
    const maxH = 560;
    const ratio = Math.min(maxW / image.naturalWidth, maxH / image.naturalHeight);
    const w = image.naturalWidth * ratio;
    const h = image.naturalHeight * ratio;
    const x = (canvas.width - w) / 2;
    const y = 520 + (maxH - h) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 45;
    ctx.drawImage(image, x, y, w, h);
    ctx.restore();

    ctx.fillStyle = design.text || "#fff";
    ctx.font = "400 24px Inter, Arial, sans-serif";
    ctx.globalAlpha = 0.62;
    ctx.fillText(product.category.slice(0, 40), 76, 1190);
    ctx.globalAlpha = 1;
    ctx.font = "800 48px Inter, Arial, sans-serif";
    ctx.fillText(product.price, 76, 1250);

    ctx.font = "800 24px Inter, Arial, sans-serif";
    const cta = (design.cta || "SHOP NOW").toUpperCase();
    ctx.fillText(cta + "  →", 760, 1250);

    const link = document.createElement("a");
    link.download = "poster-ai.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand"><span className="brand-mark"><Sparkles size={15} /></span><span>Poster AI</span></div>
        <span className="topbar-note">Product link → AI poster → PNG</span>
      </nav>

      <section className="hero">
        <div className="eyebrow"><WandSparkles size={15} /> CREATE FROM A LINK</div>
        <h1>Turn a product link into a poster people notice.</h1>
        <p className="hero-copy">Paste a product page. We extract the product and available images, then AI creates the design direction for your poster.</p>

        <div className="link-card">
          <div className="input-wrap">
            <Link2 size={20} />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") analyzeLink(); }}
              placeholder="Paste an Amazon or product link"
              aria-label="Product link"
            />
          </div>
          <button className="primary-button" onClick={analyzeLink} disabled={!canAnalyze || loading}>
            {loading ? "Reading product…" : "Create Poster"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </div>

        <div className="trust-row">
          <span>✦ Product images stay selectable</span>
          <span>✦ AI-assisted creative direction</span>
          <span>✦ Download as PNG</span>
        </div>
        {error && <div className="error-box">{error}</div>}
      </section>

      {product && (
        <section className="workspace">
          <div className="section-heading">
            <div><span className="eyebrow">PRODUCT FOUND</span><h2>Choose the images for your poster</h2></div>
            <span className="selection-count">{selected.length} selected</span>
          </div>

          <div className="product-summary">
            <div><h3>{product.name}</h3><p>{product.category} · {new URL(product.sourceUrl).hostname}</p></div>
            <strong>{product.price}</strong>
          </div>

          <div className="image-grid">
            {product.images.map((image, index) => {
              const active = selected.includes(index);
              return (
                <button className={`image-card ${active ? "selected" : ""}`} key={image.url + index} onClick={() => toggleImage(index)} aria-pressed={active}>
                  <img src={`/api/image?url=${encodeURIComponent(image.url)}`} alt={image.alt} />
                  <span className="image-overlay"><span className="check">{active ? <Check size={15} /> : <ImageIcon size={15} />}</span></span>
                </button>
              );
            })}
          </div>

          <div className="ai-panel">
            <div>
              <span className="ai-icon"><Sparkles size={18} /></span>
              <div><strong>AI design engine</strong><p>Choose a direction. AI writes the poster copy and visual direction without inventing product facts.</p></div>
            </div>
            <button className="secondary-button" disabled={selected.length === 0 || generating} onClick={generatePoster}>
              {generating ? "Creating…" : "Generate AI Poster"} <WandSparkles size={17} />
            </button>
          </div>
        </section>
      )}

      {generated && product && design && (
        <section className="poster-section">
          <div className="section-heading">
            <div><span className="eyebrow">AI POSTER</span><h2>Ready to download</h2></div>
            <button className="download-button" onClick={downloadPoster}><ArrowDownToLine size={17} /> Download PNG</button>
          </div>

          <div className="poster-result">
            <div className="poster-canvas" style={{ background: design.background }}>
              <div className="poster-glow" style={{ background: design.accent }} />
              <div className="poster-tag">{design.badge}</div>
              <h3>{design.headline}<br /><span>{design.subheadline}</span></h3>
              <div className="poster-image">
                <img src={`/api/image?url=${encodeURIComponent(product.images[selected[0]].url)}`} alt={product.name} />
              </div>
              <div className="poster-bottom">
                <div><small>{product.category}</small><strong>{product.price}</strong></div>
                <span>{design.cta} →</span>
              </div>
            </div>

            <aside className="poster-controls">
              <div className="control-block">
                <span>Design direction</span>
                <div className="pills">
                  {styles.map((item) => <button key={item} className={`pill ${style === item ? "active" : ""}`} onClick={() => { setStyle(item); setGenerated(false); }}>{item}</button>)}
                </div>
                <button className="regenerate-button" onClick={generatePoster}>Regenerate with this style</button>
              </div>
              <div className="control-block">
                <span>Selected images</span>
                <p>{selected.length} product image{selected.length === 1 ? "" : "s"} selected. The first selected image is used as the hero image in the downloadable poster.</p>
              </div>
            </aside>
          </div>
        </section>
      )}

      <footer className="footer"><span>Poster AI</span><span>From product link to creative.</span></footer>
    </main>
  );
}
