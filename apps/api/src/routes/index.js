import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import express from 'express'; 
import { Router } from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import healthCheck from './health-check.js';
import { buildQuotationHTML } from '../templates/quotation-template.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const allowedEmails = ['mrapexindustrial@gmail.com', 'manasviiiiii.jain@gmail.com'];

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE) === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getAuthenticatedAdmin = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return { errorStatus: 401, errorMessage: 'Unauthorized' };

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) return { errorStatus: 401, errorMessage: 'Invalid token' };

  const email = user.email?.toLowerCase();

  if (!allowedEmails.includes(email)) {
    return { errorStatus: 403, errorMessage: 'Access denied' };
  }

  return { user };
};

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCurrency(amount) {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function numberToWordsIndian(num) {
  const n = Math.round(Number(num || 0));
  if (n === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigit = (x) => {
    if (x < 20) return ones[x];
    return `${tens[Math.floor(x / 10)]} ${ones[x % 10]}`.trim();
  };

  const threeDigit = (x) => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    return `${h ? `${ones[h]} Hundred ` : ''}${r ? twoDigit(r) : ''}`.trim();
  };

  let x = n;
  const crore = Math.floor(x / 10000000);
  x %= 10000000;
  const lakh = Math.floor(x / 100000);
  x %= 100000;
  const thousand = Math.floor(x / 1000);
  x %= 1000;
  const hundred = x;

  const parts = [];
  if (crore) parts.push(`${threeDigit(crore)} Crore`);
  if (lakh) parts.push(`${threeDigit(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigit(thousand)} Thousand`);
  if (hundred) parts.push(threeDigit(hundred));

  return `Rupees ${parts.join(' ')} Only`;
}

function imageBase64(fileName) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, '../assets', fileName);

    if (!fs.existsSync(filePath)) return '';

    return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`;
  } catch {
    return '';
  }
}

router.get('/health', healthCheck);
router.get('/route-test', (req, res) => {
  return res.json({
    success: true,
    message: 'index.js route file is active',
  });
});

router.get('/upload-r2', async (req, res) => {
  return res.json({
    success: true,
    message: 'R2 Upload Route Working',
  });
});

router.post('/upload-r2', upload.single('image'), async (req, res) => {
  try {
    const auth = await getAuthenticatedAdmin(req);

    if (auth.errorStatus) {
      return res.status(auth.errorStatus).json({
        success: false,
        error: auth.errorMessage,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded',
      });
    }

    const safeName = req.file.originalname
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '')
      .toLowerCase();

    const fileName = `mr-apex-product-images/${Date.now()}-${safeName}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return res.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/test-email-check', async (req, res) => {
  return res.json({
    success: true,
    message: 'Email test route is available',
    from: process.env.SMTP_FROM,
  });
});

router.post('/send-test-email', async (req, res) => {
  try {
    const auth = await getAuthenticatedAdmin(req);

    if (auth.errorStatus) {
      return res.status(auth.errorStatus).json({
        success: false,
        error: auth.errorMessage,
      });
    }

    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email required',
      });
    }

    await mailTransporter.sendMail({
      from: '"MR Apex Industrial Components" <sales@mrapexindustrial.in>',
      sender: 'admin@mrapexindustrial.in',
      replyTo: 'sales@mrapexindustrial.in',
      to,
      subject: 'MR Apex Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; color:#111827;">
          <h2>MR Apex Industrial Components</h2>
          <p>This is a test email from MR Apex Admin Panel.</p>
          <p>If you received this email, SMTP setup is working correctly.</p>
          <br />
          <p>Regards,<br/>MR Apex Industrial Components</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/quotations/:id/send-test', (req, res) => {
  return res.json({
    success: true,
    message: 'send test route working',
    id: req.params.id,
  });
});

// 1. PDF Generation Route (Fixed with Render flags)
router.post('/quotations/:id/pdf', async (req, res) => {
  let browser;

  try {
    const auth = await getAuthenticatedAdmin(req);

    if (auth.errorStatus) {
      return res.status(auth.errorStatus).json({
        success: false,
        error: auth.errorMessage,
      });
    }

    const { id } = req.params;

    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (quotationError || !quotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found',
      });
    }

    const { data: items, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return res.status(500).json({
        success: false,
        error: itemsError.message,
      });
    }

    const html = buildQuotationHTML(quotation, items || []);

   // Render environment compatible launch settings
    browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Memory management ke liye zaroori
    '--disable-gpu',
    '--no-zygote',
    '--single-process',       // RAM bachane ka sabse bada tareeka
    '--disable-extensions',
    '--disable-infobars',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-notifications'
  ],
  executablePath: undefined
});

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${quotation.quotation_no.replaceAll('/', '-')}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    if (browser) await browser.close();

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 2. Email Route (Fixed with Render flags and Admin BCC/Copy)
router.post('/quotations/:id/send', async (req, res) => {
  let browser;

  try {
    const auth = await getAuthenticatedAdmin(req);

    if (auth.errorStatus) {
      return res.status(auth.errorStatus).json({
        success: false,
        error: auth.errorMessage,
      });
    }
    } catch (error) {
    if (browser) await browser.close();
    
    // Ye line console mein error dikhayegi
    console.error("DEBUG ERROR STACK:", error); 

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  

    const { id } = req.params;

    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (quotationError || !quotation) {
      return res.status(404).json({
        success: false,
        error: 'Quotation not found',
      });
    }

    if (!quotation.email) {
      return res.status(400).json({
        success: false,
        error: 'Customer email not found in quotation',
      });
    }

    const { data: items, error: itemsError } = await supabase
      .from('quotation_items')
      .select('*')
      .eq('quotation_id', id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      return res.status(500).json({
        success: false,
        error: itemsError.message,
      });
    }

    const html = buildQuotationHTML(quotation, items || []);

    // Render environment compatible launch settings
    browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Memory management ke liye zaroori
    '--disable-gpu',
    '--no-zygote',
    '--single-process',       // RAM bachane ka sabse bada tareeka
    '--disable-extensions',
    '--disable-infobars',
    '--hide-scrollbars',
    '--mute-audio',
    '--disable-notifications'
  ],
  executablePath: undefined
});

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    await browser.close();

    const quotationFileName = `${quotation.quotation_no.replaceAll('/', '-')}.pdf`;

    const mailInfo = await mailTransporter.sendMail({
      from: `"MR Apex Industrial Components" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: quotation.email,
      bcc: allowedEmails.join(', '), // Dono admins ko security copy silently chali jayegi
      subject: `Quotation ${quotation.quotation_no} - MR Apex Industrial Components`,
      html: `
        <p>Dear ${quotation.customer_name || 'Customer'},</p>

        <p>Please find attached our quotation <b>${quotation.quotation_no}</b>.</p>

        <p>
          Company: <b>${quotation.company_name || '-'}</b><br/>
          Grand Total: <b>₹ ${Number(quotation.grand_total || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}</b>
        </p>

        <p>Regards,<br/>
        <b>MR Apex Industrial Components</b><br/>
        sales@mrapexindustrial.in</p>
      `,
      attachments: [
        {
          filename: quotationFileName,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    console.log('Quotation mail sent info:', mailInfo);

    const { error: updateError } = await supabase
      .from('quotations')
      .update({
        status: true,
        sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: updateError.message,
      });
    }

    return res.json({
      success: true,
      message: 'Quotation email sent successfully',
      sent_to: quotation.email,
    });
  } catch (error) {
    if (browser) await browser.close();

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default () => router;