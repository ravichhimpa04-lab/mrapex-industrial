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
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
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

async function launchPdfBrowser() {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
    ],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  return puppeteer.launch(launchOptions);
}

async function makePdfBuffer(html) {
  const browser = await launchPdfBrowser();

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
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
    console.log('SMTP HOST:', process.env.SMTP_HOST);
console.log('SMTP PORT:', process.env.SMTP_PORT);
console.log('SMTP USER:', process.env.SMTP_USER);

await mailTransporter.verify();
console.log('SMTP VERIFIED');

    await mailTransporter.sendMail({
      from: `"MR Apex Industrial Components" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      replyTo: process.env.SMTP_FROM || process.env.SMTP_USER,
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

router.post('/quotations/:id/pdf', async (req, res) => {
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
    const pdfFile = await makePdfBuffer(html);
    const quotationFileName = `${quotation.quotation_no.replaceAll('/', '-')}.pdf`;

    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfFile.length);
    res.setHeader('Content-Disposition', `attachment; filename="${quotationFileName}"`);

    return res.end(pdfFile);
  } catch (error) {
    console.error('PDF GENERATION ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/quotations/:id/send', async (req, res) => {
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

    if (!quotation.email) {
      return res.status(400).json({
        success: false,
        error: 'Customer email not found',
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
const pdfFile = await makePdfBuffer(html);
const quotationFileName = `${quotation.quotation_no.replaceAll('/', '-')}.pdf`;

console.log('========== SMTP DEBUG ==========');
console.log('SMTP HOST:', process.env.SMTP_HOST);
console.log('SMTP PORT:', process.env.SMTP_PORT);
console.log('SMTP SECURE:', process.env.SMTP_SECURE);
console.log('SMTP USER:', process.env.SMTP_USER);
console.log('SMTP FROM:', process.env.SMTP_FROM);
console.log('================================');

await mailTransporter.verify();

console.log('SMTP VERIFIED SUCCESSFULLY');

await mailTransporter.sendMail({
      from: `"MR Apex Industrial Components" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: quotation.email,
      bcc: allowedEmails.join(', '),
      subject: `Quotation ${quotation.quotation_no} - MR Apex Industrial Components`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#111827;">
          <p>Dear ${escapeHtml(quotation.customer_name || 'Customer')},</p>
          <p>Please find attached our quotation <b>${escapeHtml(quotation.quotation_no)}</b>.</p>
          <p>Regards,<br/><b>MR Apex Industrial Components</b></p>
        </div>
      `,
      attachments: [
        {
          filename: quotationFileName,
          content: pdfFile,
          contentType: 'application/pdf',
        },
      ],
    });

    await supabase
      .from('quotations')
      .update({
        status: 'Sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id);

    return res.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('SEND QUOTATION ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default () => router;