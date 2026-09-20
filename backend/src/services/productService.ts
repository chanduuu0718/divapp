import * as cheerio from "cheerio";

export type ProductImage = {
  url: string;
  alt: string;
};

export type Product = {
  sourceUrl: string;
  name: string;
  price: string;
  currency: string;
  category: string;
  images: ProductImage[];
};

function absoluteUrl(value: string | undefined, base: string) {
  if (!value) return "";
  try {
    return new URL(value, base).href;
  } catch {
    return "";
  }
}

function clean(value: unknown) {
  return String(value ?? "").replace(/\\s+/g, " ").trim();
}

function collectJsonLdProducts(value: unknown, output: any[]) {
  if (!value) return;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdProducts(item, output);
    return;
  }
  if (typeof value !== "object") return;
  const item = value as Record<string, unknown>;
  if (item["@graph"]) collectJsonLdProducts(item["@graph"], output);
  if (String(item["@type"] || "").toLowerCase().includes("product")) output.push(item);
}

export async function extractProduct(sourceUrl: string): Promise<Product> {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error("Please paste a valid http/https product URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Please paste a valid http/https product URL.");
  }

  const response = await fetch(parsed, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PosterAI/1.0; +https://github.com/chanduuu0718/divapp)",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`The product page returned HTTP ${response.status}. This site may block automated requests.`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const jsonLd: any[] = [];

  $('script[type="application/ld+json"]').each((_index, element) => {
    try {
      const raw = $(element).text();
      collectJsonLdProducts(JSON.parse(raw), jsonLd);
    } catch {
      // Ignore malformed JSON-LD.
    }
  });

  const product = jsonLd[0] || {};
  const offers = Array.isArray(product.offers) ? product.offers[0] : (product.offers || {});

  const name =
    clean(product.name) ||
    clean($('meta[property="og:title"]').attr("content")) ||
    clean($("title").text());

  const price =
    clean(offers.price) ||
    clean($('meta[property="product:price:amount"]').attr("content")) ||
    clean($('[itemprop="price"]').attr("content"));

  const currency =
    clean(offers.priceCurrency) ||
    clean($('meta[property="product:price:currency"]').attr("content")) ||
    "INR";

  const category =
    clean(product.category) ||
    clean($('meta[property="product:category"]').attr("content")) ||
    "Product";

  const imageCandidates: string[] = [];
  const addImage = (value: unknown) => {
    if (typeof value === "string") imageCandidates.push(value);
    if (Array.isArray(value)) value.forEach(addImage);
  };

  addImage(product.image);
  $('meta[property="og:image"]').each((_i, el) => addImage($(el).attr("content")));
  $('meta[name="twitter:image"]').each((_i, el) => addImage($(el).attr("content")));

  const images = Array.from(new Set(imageCandidates
    .map((image) => absoluteUrl(image, response.url || sourceUrl))
    .filter(Boolean)))
    .slice(0, 12)
    .map((url) => ({ url, alt: name || "Product image" }));

  if (!name) {
    throw new Error("We could not identify the product name on this page. Try a product page that exposes standard product metadata.");
  }

  if (!images.length) {
    throw new Error("We found the product page but no usable product images. This site may require an approved product-data API.");
  }

  return {
    sourceUrl: response.url || sourceUrl,
    name,
    price: price ? `${currency === "INR" ? "₹" : currency + " "}${price}` : "Price unavailable",
    currency,
    category,
    images,
  };
}