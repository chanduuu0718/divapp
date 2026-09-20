import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Image as ImageIcon,
  Link2,
  Sparkles,
  WandSparkles,
} from "lucide-react";

type Product = {
  name: string;
  price: string;
  category: string;
  images: string[];
};

const demoProduct: Product = {
  name: "Premium Wireless Headphones",
  price: "₹2,499",
  category: "Audio • Electronics",
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?auto=format&fit=crop&w=900&q=85",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=85",
  ],
};

export default function App() {
  const [url, setUrl] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<number[]>([0, 1]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const canGenerate = useMemo(() => url.trim().length > 5, [url]);

  function analyzeLink() {
    setLoading(true);
    setGenerated(false);

    window.setTimeout(() => {
      setProduct(demoProduct);
      setSelected([0, 1]);
      setLoading(false);
    }, 900);
  }

  function toggleImage(index: number) {
    setSelected((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand">
          <span className="brand-mark"><Sparkles size={15} /></span>
          <span>Poster AI</span>
        </div>
        <span className="topbar-note">AI product poster generator</span>
      </nav>

      <section className="hero">
        <div className="eyebrow"><WandSparkles size={15} /> CREATE FROM A LINK</div>
        <h1>Turn any product link into a poster people notice.</h1>
        <p className="hero-copy">
          Paste a product page. Pick the images you like. Let AI shape the layout,
          copy and visual direction.
        </p>

        <div className="link-card">
          <div className="input-wrap">
            <Link2 size={20} />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canGenerate) analyzeLink();
              }}
              placeholder="Paste an Amazon or product link"
              aria-label="Product link"
            />
          </div>
          <button className="primary-button" onClick={analyzeLink} disabled={!canGenerate || loading}>
            {loading ? "Analyzing…" : "Create Poster"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </div>

        <div className="trust-row">
          <span>✦ No design skills needed</span>
          <span>✦ AI-assisted layouts</span>
          <span>✦ Select your own images</span>
        </div>
      </section>

      {product && (
        <section className="workspace">
          <div className="section-heading">
            <div>
              <span className="eyebrow">PRODUCT FOUND</span>
              <h2>Choose the images for your poster</h2>
            </div>
            <span className="selection-count">{selected.length} selected</span>
          </div>

          <div className="product-summary">
            <div>
              <h3>{product.name}</h3>
              <p>{product.category}</p>
            </div>
            <strong>{product.price}</strong>
          </div>

          <div className="image-grid">
            {product.images.map((image, index) => {
              const active = selected.includes(index);
              return (
                <button
                  className={`image-card ${active ? "selected" : ""}`}
                  key={image}
                  onClick={() => toggleImage(index)}
                  aria-pressed={active}
                >
                  <img src={image} alt={`${product.name} option ${index + 1}`} />
                  <span className="image-overlay">
                    <span className="check">
                      {active ? <Check size={15} /> : <ImageIcon size={15} />}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ai-panel">
            <div>
              <span className="ai-icon"><Sparkles size={18} /></span>
              <div>
                <strong>AI will design around your product</strong>
                <p>
                  It can adapt the visual mood, spacing, typography and composition
                  instead of forcing every product into the same template.
                </p>
              </div>
            </div>
            <button
              className="secondary-button"
              disabled={selected.length === 0}
              onClick={() => setGenerated(true)}
            >
              Generate AI Poster
              <WandSparkles size={17} />
            </button>
          </div>
        </section>
      )}

      {generated && (
        <section className="poster-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">AI PREVIEW</span>
              <h2>Your first poster direction</h2>
            </div>
          </div>

          <div className="poster-result">
            <div className="poster-canvas">
              <div className="poster-glow" />
              <div className="poster-tag">NEW SOUND</div>
              <h3>Premium audio.<br /><span>Zero distractions.</span></h3>
              <div className="poster-image">
                <img src={product.images[selected[0] ?? 0]} alt={product.name} />
              </div>
              <div className="poster-bottom">
                <div>
                  <small>{product.category}</small>
                  <strong>{product.price}</strong>
                </div>
                <span>SHOP NOW →</span>
              </div>
            </div>

            <aside className="poster-controls">
              <div className="control-block">
                <span>Design direction</span>
                <div className="pills">
                  <button className="pill active">AI Pick</button>
                  <button className="pill">Premium</button>
                  <button className="pill">Minimal</button>
                  <button className="pill">Bold</button>
                  <button className="pill">Luxury</button>
                </div>
              </div>
              <div className="control-block">
                <span>What happens next</span>
                <p>Connect the product-data API and image-generation layer to turn this prototype into a live public generator.</p>
              </div>
            </aside>
          </div>
        </section>
      )}

      <footer className="footer">
        <span>Poster AI</span>
        <span>From product link to creative.</span>
      </footer>
    </main>
  );
}