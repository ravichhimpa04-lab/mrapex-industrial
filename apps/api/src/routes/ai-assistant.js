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
- If no matched products are available, politely ask customer to share part number, make, machine model, or requirement details.
- Do not ask the customer to upload or share an image because image upload is not available in this assistant yet.
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

router.post('/parse-quotation-voice', async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || '').trim();

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required',
      });
    }

    const prompt = `
You are extracting commercial quotation details from a spoken voice command inside the MR Apex Industrial Components admin system (Apex AI Employee).

The voice transcript may be in English, Hindi, or Hinglish (a mix of both, written in Roman/Devanagari script). Understand it regardless of language.

Voice transcript (raw, may contain speech-to-text errors):
"${transcript}"

Extract the following fields and return ONLY valid JSON, no markdown, no explanation, no code fences:
{
  "company_name": string or null,
  "rate": number or null,
  "delivery_days": number or null,
  "payment_terms": string or null,
  "warranty": string or null,
  "gst_note": string or null,
  "product_hint": string or null,
  "notes": string or null
}

Field rules:
- "company_name": the customer/company name mentioned, if any.
- "rate": the total quoted price/amount mentioned, as a plain number only (no currency symbols, no commas, no words).
- "delivery_days": delivery timeframe in days, as a plain number only. Convert weeks to days if needed.
- "payment_terms": short description of payment terms mentioned (e.g. "Advance payment", "50% advance balance before dispatch").
- "warranty": short description of warranty period mentioned (e.g. "3 months", "1 year"), only if the owner actually said it. Otherwise null — do not invent a warranty period.
- "gst_note": one of "GST Extra", "GST Included", or null if not mentioned.
- "product_hint": any product name or part number mentioned, if any.
- "notes": anything else relevant that does not fit above fields, else null.
- If a field is not mentioned in the transcript, use null for it. Do not guess or invent values.
- Return ONLY the JSON object, nothing else.
- Even if the transcript is in Hindi or Hinglish, write all output field values in English (since they may be used in a customer-facing quotation).
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let parsed;

    try {
      const cleanedJson = response.text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('PARSE QUOTATION VOICE - JSON PARSE ERROR:', parseError, response.text);

      return res.status(500).json({
        success: false,
        error: 'AI response could not be parsed as JSON',
      });
    }

    return res.json({
      success: true,
      parsed,
    });
  } catch (error) {
    console.error('PARSE QUOTATION VOICE ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/apex-command', async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || '').trim();

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required',
      });
    }

    const prompt = `
You are Apex, an AI office employee for MR Apex Industrial Components. The owner just spoke a voice command or question to you. It may be in English, Hindi, or Hinglish (mixed).

Voice input: "${transcript}"

Classify this into exactly one intent and extract relevant fields. Return ONLY valid JSON, no markdown, no code fences, no explanation:

{
  "intent": "create_quotation" | "revise_quotation" | "send_message" | "set_contact_preference" | "delete_enquiry" | "admin_update" | "admin_query" | "discuss" | "unclear",
  "enquiry_number": number or null,
  "company_name": string or null,
  "customer_name": string or null,
  "rate": number or null,
  "discount_percent": number or null,
  "delivery_days": number or null,
  "payment_terms": string or null,
  "warranty": string or null,
  "gst_note": "GST Extra" | "GST Included" | null,
  "product_hint": string or null,
  "message_content": string or null,
  "revision_message": string or null,
  "do_not_contact": boolean or null,
  "delete_all": boolean or null,
  "enquiry_number_from": number or null,
  "enquiry_number_to": number or null,
  "admin_table": "products" | "categories" | "sub_categories" | null,
  "admin_record_identifier": string or null,
  "admin_field": "product_name" | "part_number" | "category" | "sub_category" | "make" | "description" | "status" | "name" | null,
  "admin_value": string or null,
  "notes": string or null
}

Rules:
- "delete_enquiry": the owner wants to permanently DELETE an enquiry (and its quotation if any) — e.g. "enquiry number 23 delete kar do", "ABC company ki enquiry hata do", "saari enquiry delete kar do" (delete ALL — set "delete_all": true in this case, and leave enquiry_number/company_name null), "enquiry number 20 se 25 tak delete kar do" (a RANGE — set "enquiry_number_from" and "enquiry_number_to" to the two boundary numbers, inclusive, and leave "enquiry_number" null). STRONG PRIORITY RULE: if the transcript contains any deletion word — "delete", "hata do", "mita do", "nikaal do", "remove kar do", "khatam kar do" — together with a reference to an enquiry/number/company, ALWAYS classify as "delete_enquiry", even if the sentence is long, repeated, or contains filler/hesitation (e.g. "main enquiry number 20 ki baat kar raha hoon... isko delete kar do" is still "delete_enquiry", not "discuss"). Never classify a clear deletion request as "discuss".
- "create_quotation": the owner wants to create a BRAND NEW quotation from an enquiry, typically mentioning a name/enquiry and a fresh price/rate.
- "revise_quotation": the owner wants to FIRMLY, UNCONDITIONALLY change the actual QUOTED RATE, discount, delivery time, warranty, or payment terms right now, AND resend the formal quotation (with pricing/PDF) again — e.g. "give a 5% discount and resend", "change the rate to 24500 and resend", "warranty 6 months kar do aur bhej do". STRONG SIGNALS: "discount", "rate", "resend", "phir se bhejo" combined with a number, stated as a direct, unconditional instruction.
- CRITICAL DISAMBIGUATION: if the owner mentions a conditional/hypothetical offer (e.g. "agar aaj deal close karte hain toh 2% aur denge") WITHOUT any explicit instruction to send/resend a quotation, this is "send_message" — put the conditional offer into "message_content", do NOT set "discount_percent" or "rate". BUT — if the owner ALSO explicitly says to send/resend the quotation (words like "bhejo", "bhej do", "resend karo", "dobara se bhejo", "phir se bhejo"), then it is "revise_quotation" regardless of any conditional language present — an explicit send/resend instruction ALWAYS wins. In that case, set "rate"/"discount_percent" as normal from any firm numbers given, and put the conditional/incentive wording into "revision_message" so it gets included as an explanatory note in the resend email. Only classify as "send_message" when there is truly no explicit instruction to send/resend the formal quotation at all.
- "send_message": the owner wants Apex to communicate something to the customer that is NOT a formal quotation/pricing change — e.g. "unse bol do delivery time kam kar denge", "customer ko batao hum jaldi bhej denge", "unko ek mail kar do ki hum soch rahe hain", "reply kar do unhe", or a CONDITIONAL incentive like "bol do agar aaj close karte hain toh 2% aur discount de denge". This is for general correspondence/discussion with the customer, written as a professional email, WITHOUT resending the quotation PDF or changing its actual rate. Put whatever the owner wants conveyed (their intent, in their own words or paraphrased, including any conditions like "if you confirm today") into "message_content".
- "set_contact_preference": the owner wants to STOP (or resume) any further emails — including automatic follow-up reminders — being sent to a specific customer/enquiry/quotation. e.g. "ab isko koi mail mat karo", "iska follow-up band kar do", "isse contact mat karo". Set "do_not_contact" to true for stopping, or false if the owner explicitly wants to resume contacting them again.
- "admin_update": the owner wants to ADD or CHANGE a specific field on a specific Product, Category, or Sub-Category — e.g. "XYZ pump product mein part number ABC123 add karo", "wheel bearing ka category change kar do", "make Bosch kar do us product ka". Set "admin_table" to which table this is about, "admin_record_identifier" to the name/description the owner used to refer to the specific record (e.g. the product name), "admin_field" to the exact column being changed (map spoken words to the closest of: product_name, part_number, category, sub_category, make, description, status, name), and "admin_value" to the new value they want set.
- "admin_query": the owner is asking a QUESTION about Products/Categories/Sub-Categories data — e.g. "kaunse products mein part number missing hai", "kitne products inactive hain", "XYZ category mein kitne products hain". Set "admin_table" to which table this is about, and put the actual question in "notes". Do NOT set "admin_field"/"admin_value" for a query — those are only for "admin_update".
- "discuss": ANY question, investigation, confusion, or open-ended request about a customer/enquiry/quotation that is not one of the above actions — e.g. "kya reply aaya", "customer keh raha hai mail nahi mila, check karo kya hua", "poori details batao", "iska kya status hai". This is a broad catch-all for conversation — prefer this over "unclear" whenever the owner is asking about or discussing something specific.
- "unclear": ONLY use this if the input is truly unintelligible or empty of any real meaning (e.g. background noise transcribed as random words).
- "enquiry_number": if the owner refers to an enquiry by its number (e.g. "enquiry number 32", "32 wali enquiry", "number 5 ko"), extract that number here. Otherwise null.
- "discount_percent": if the owner mentions a percentage discount to apply to the existing/previous rate (e.g. "5% discount", "10 percent kam kar do"), extract the plain number here (e.g. 5, 10). Only used for "revise_quotation". Otherwise null.
- "rate": for "create_quotation", the fresh quoted price. For "revise_quotation", only set this if the owner gives a brand new absolute rate (not a discount percentage) — otherwise leave null and use "discount_percent" instead.
- "delivery_days": ONLY set this if the owner explicitly states a delivery time AND wants the formal quotation re-sent with it (i.e. "revise_quotation"). If the owner just wants to casually MENTION a delivery change in a message without resending the formal quotation, put that in "message_content" instead under "send_message", and leave "delivery_days" null.
- "payment_terms": ONLY set this if the owner explicitly states payment terms as part of a formal "revise_quotation". Never guess or default this.
- "warranty": ONLY set this if the owner explicitly states a warranty period as part of a formal "revise_quotation". Never guess or default this.
- "message_content": ONLY used for "send_message" — capture what the owner wants conveyed to the customer, in plain English, however casually they phrased it.
- "revision_message": ONLY used for "revise_quotation" — if the owner ALSO dictates something they want explained or written in the email alongside the price/terms change (e.g. "aur mail mein likh do ki yeh advance payment ki condition ke saath hai"), capture that explanatory content here, in plain English. Leave null if the owner only gave numbers with no extra explanation to write.
- "do_not_contact": ONLY used for "set_contact_preference" — true to stop all contact, false to explicitly resume it.
- IMPORTANT: the owner may refer to a customer by their personal first name (e.g. "Kamal", "Amit") rather than a company name — put personal names in "customer_name". If it sounds like a business/company name (e.g. "ABC Company", "XYZ Industries"), put it in "company_name". If unsure, fill in whichever field seems most likely, and leave the other null.
- "rate", "discount_percent" and "delivery_days" must be plain numbers only (no currency symbols, no commas, no words, no % sign).
- Even though the input may be in Hindi/Hinglish, write all extracted string field values in English.
- Return ONLY the JSON object.
`;


    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let parsed;

    try {
      const cleanedJson = response.text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('APEX COMMAND - JSON PARSE ERROR:', parseError, response.text);

      return res.status(500).json({
        success: false,
        error: 'AI response could not be parsed as JSON',
      });
    }

    return res.json({
      success: true,
      parsed,
    });
  } catch (error) {
    console.error('APEX COMMAND ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Open-ended reasoning endpoint — NO fixed response template. Apex is given
// the owner's exact question plus the complete, real event history for the
// relevant customer/quotation(s), and reasons out a genuine answer, the way
// an employee who was actually present for the whole conversation would.
router.post('/discuss', async (req, res) => {
  try {
    const transcript = String(req.body?.transcript || '').trim();
    const historyText = String(req.body?.historyText || '').trim();
    const contextText = String(req.body?.contextText || '').trim();

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required',
      });
    }

    const prompt = `
You are Apex, a real office employee at MR Apex Industrial Components — not a chatbot, not a script. You personally handled every step of this customer's quotation yourself, so you actually remember all of it.

${contextText ? `Who this is about:\n${contextText}\n` : ''}

Here is the COMPLETE, real, chronological history of everything that happened, in your own past actions and the customer's actual replies (oldest first):
${historyText || 'No history is available yet for this customer/quotation.'}

The owner (your boss) just asked you, out loud:
"${transcript}"

Answer exactly like a real employee would answer their boss verbally — in your own words, based ONLY on what actually happened above. Rules:
- Do not use a fixed report format or template. Just talk naturally, the way a person recalling events would.
- If the owner's question implies a discrepancy, contradiction, or confusion (e.g. the customer claims something that doesn't match your records), point that out honestly and suggest what might explain it, based on the real history and rules you know (e.g. spam folder, wrong email, reply came from a different address, mail server delay).
- If you are genuinely missing information to answer confidently, say so plainly instead of guessing.
- If something relevant is missing that you'd need to do your job properly (e.g. no delivery time was ever given, no warranty was specified), you may mention that too, naturally, if it is relevant to what was asked.
- Keep it conversational and appropriately brief — the length of a real spoken answer, not a formal report. A few sentences is usually enough unless the owner is asking for a detailed recap of everything.
- Respond in the same language style as the owner's question (English, Hindi, or Hinglish, matching their phrasing).
- Do not mention that you are an AI, a system, a database, or that you have "history" or "logs" — you simply remember, like a person does.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.json({
      success: true,
      answer: (response.text || '').trim(),
    });
  } catch (error) {
    console.error('APEX DISCUSS ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Turns whatever the owner dictated (casually, in Hindi/Hinglish/English)
// into a short, professional email body to send to the customer.
router.post('/compose-message', async (req, res) => {
  try {
    const instruction = String(req.body?.instruction || '').trim();
    const contextText = String(req.body?.contextText || '').trim();

    if (!instruction) {
      return res.status(400).json({
        success: false,
        error: 'Instruction is required',
      });
    }

    const prompt = `
You are a sales professional at MR Apex Industrial Components, writing a short follow-up email to a customer about their quotation.

${contextText ? `Context:\n${contextText}\n` : ''}

Your manager just told you (casually, possibly in Hindi/Hinglish) what to convey to the customer:
"${instruction}"

Write a short, professional, polite email BODY (2-5 sentences) conveying this to the customer. Rules:
- Output valid HTML using only <p> and <b> tags (no <html>, <body>, <head>, no styling, no signature — the signature is added separately).
- Do not invent any commitments, numbers, or details beyond what was said above.
- Keep the tone warm and professional, as MR Apex Industrial Components would write to a customer.
- Do not start with "Dear Customer" or any greeting — that will be added separately. Just write the message body itself.
- Return ONLY the HTML, nothing else.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const messageHtml = (response.text || '').replace(/```html|```/g, '').trim();

    return res.json({
      success: true,
      messageHtml,
    });
  } catch (error) {
    console.error('COMPOSE MESSAGE ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ---------- Text-to-Speech (cloud voice — same everywhere, not device-dependent) ----------
// Uses Azure Speech Services' neural voices so Apex always sounds like the
// same natural female voice, regardless of which browser/OS is playing it —
// unlike the browser's built-in speechSynthesis, whose voice depends entirely
// on what happens to be installed on that specific device.
function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

router.post('/tts', async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    const lang = String(req.body?.lang || 'en-IN');

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
      return res.status(503).json({
        success: false,
        error: 'Azure Speech is not configured on the server yet.',
      });
    }

    const voiceName = lang.toLowerCase().startsWith('hi') ? 'hi-IN-SwaraNeural' : 'en-IN-NeerjaNeural';

    const ssml = `<speak version='1.0' xml:lang='${lang}'><voice xml:lang='${lang}' xml:gender='Female' name='${voiceName}'>${escapeXml(
      text
    )}</voice></speak>`;

    const azureResponse = await fetch(
      `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3',
          'User-Agent': 'ApexAIEmployee',
        },
        body: ssml,
      }
    );

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      throw new Error(`Azure TTS request failed (${azureResponse.status}): ${errorText}`);
    }

    const audioBuffer = Buffer.from(await azureResponse.arrayBuffer());

    return res.json({
      success: true,
      audio: audioBuffer.toString('base64'),
    });
  } catch (error) {
    console.error('TTS ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;