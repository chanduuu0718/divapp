import OpenAI from "openai";

type ProductInput = {
  name: string;
  price: string;
  category: string;
};

const fallback = (product: ProductInput, style: string) => ({
  headline: product.name.length > 34 ? product.name.slice(0, 34) + "…" : product.name,
  subheadline: style === "Luxury" ? "Designed to stand out." : "Made for your next favorite.",
  badge: "FEATURED",
  cta: "SHOP NOW",
  accent: style === "Minimal" ? "#111111" : "#6b5cff",
  background: style === "Bold" ? "#111111" : "#17171b",
  text: "#ffffff",
});

export async function createPosterDesign(product: ProductInput, style: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback(product, style);

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

  const response = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are a product-poster art director. Return ONLY valid JSON with keys headline, subheadline, badge, cta, accent, background, text. Use only facts supplied by the user. Never invent discounts, specifications, reviews, guarantees, or prices. Keep headline under 42 characters and subheadline under 60 characters.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({ product, style }),
          },
        ],
      },
    ],
  });

  const raw = response.output_text?.trim() || "";
  try {
    return JSON.parse(raw);
  } catch {
    return fallback(product, style);
  }
}