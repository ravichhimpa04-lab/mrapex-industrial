import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cleanText = (value = '') =>
  String(value)
    .toLowerCase()
    .trim();

const buildSearchText = (product) =>
  cleanText(
    [
      product.product_name,
      product.part_number,
      product.category,
      product.sub_category,
      product.make,
      product.description,
    ]
      .filter(Boolean)
      .join(' ')
  );

router.get('/test', async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Reply only with: MR Apex AI Working',
    });

    return res.json({
      success: true,
      message: response.text,
    });
  } catch (error) {
    console.error('AI TEST ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/product-assistant', async (req, res) => {
  try {
    const userMessage = cleanText(req.body?.message);

    if (!userMessage) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    const { data: products, error } = await supabase
      .from('products')
      .select(
        'id, product_name, part_number, category, sub_category, make, description, image_url, slug, status'
      )
      .eq('status', 'Active')
      .limit(300);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    const words = userMessage
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2);

    const matchedProducts = (products || [])
      .map((product) => {
        const productText = buildSearchText(product);

        let score = 0;

        words.forEach((word) => {
          if (productText.includes(word)) score += 1;
        });

        if (
          product.part_number &&
          userMessage.includes(cleanText(product.part_number))
        ) {
          score += 5;
        }

        if (product.make && userMessage.includes(cleanText(product.make))) {
          score += 3;
        }

        return {
          ...product,
          score,
        };
      })
      .filter((product) => product.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const productSummary = matchedProducts.map((product) => ({
      productName: product.product_name,
      partNumber: product.part_number,
      make: product.make,
      category: product.category,
      subCategory: product.sub_category,
      description: product.description,
    }));

    const prompt = `
You are MR Apex Industrial Components AI Assistant.

Business:
MR Apex Industrial Components supplies industrial machinery spare parts in India.
You help customers find matching products and request quotations.

Customer message:
${userMessage}

Matched products from database:
${JSON.stringify(productSummary, null, 2)}

Rules:
- Do not invent products.
- If matched products are available, say you found possible matching products.
- If no matched products are available, politely ask customer to share part number, make, machine model, image, or requirement.
- Keep answer short and professional.
- Mention MR Apex can provide quotation after requirement confirmation.
- Do not mention internal database or AI.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      reply: response.text,
      products: matchedProducts.map((product) => ({
        id: product.id,
        product_name: product.product_name,
        part_number: product.part_number,
        make: product.make,
        category: product.category,
        sub_category: product.sub_category,
        description: product.description,
        image_url: product.image_url,
        slug: product.slug,
      })),
    });
  } catch (error) {
    console.error('AI PRODUCT ASSISTANT ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;