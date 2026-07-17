import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import logger from './logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const REPLY_CHECK_INTERVAL_MS = Number(process.env.REPLY_CHECK_INTERVAL_MS || 120000);

function extractEmailAddress(message) {
  const fromEntry = message.envelope?.from?.[0];
  if (!fromEntry) return '';
  return String(fromEntry.address || '').toLowerCase().trim();
}

function getSubject(message) {
  return String(message.envelope?.subject || '');
}

async function summarizeReplyIntent(replyText, quotation) {
  if (!replyText || !replyText.trim()) return null;

  try {
    const prompt = `
A customer replied by email to a sales quotation from MR Apex Industrial Components.

Quotation number: ${quotation.quotation_no || 'unknown'}
Customer: ${quotation.customer_name || 'unknown'}

Customer's email reply (raw text, may include quoted history - focus only on their new message):
"""
${replyText.slice(0, 1500)}
"""

In ONE short sentence (max 20 words), summarize what the customer wants or is asking about. Focus on actionable intent such as: requesting a discount, asking about delivery time, confirming the order, asking for changes, raising a concern, or general acknowledgement.

Return ONLY the one-sentence summary, no explanation, no quotes, no markdown.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return (response.text || '').trim().slice(0, 300) || null;
  } catch (error) {
    logger.error('Reply monitor - AI intent summarization error:', error);
    return null;
  }
}

async function logEvent(quotationId, eventType, eventDetail) {
  try {
    const { error } = await supabase.from('quotation_events').insert([
      {
        quotation_id: quotationId,
        event_type: eventType,
        event_detail: eventDetail,
      },
    ]);

    if (error) {
      logger.error('Reply monitor - failed to log event:', error);
    }
  } catch (error) {
    logger.error('Reply monitor - failed to log event:', error);
  }
}

async function checkForReplies() {
  const imapHost = process.env.IMAP_HOST;
  const imapPort = Number(process.env.IMAP_PORT || 993);
  const imapUser = process.env.IMAP_USER;
  const imapPassword = process.env.IMAP_PASSWORD;
  const imapSecure = String(process.env.IMAP_TLS || 'true') === 'true';

  if (!imapHost || !imapUser || !imapPassword) {
    logger.warn('Reply monitor skipped: IMAP settings not configured in environment variables');
    return;
  }

  const client = new ImapFlow({
    host: imapHost,
    port: imapPort,
    secure: imapSecure,
    auth: {
      user: imapUser,
      pass: imapPassword,
    },
    logger: false,
  });

  try {
    await client.connect();

    const lock = await client.getMailboxLock('INBOX');

    try {
      // All currently-sent quotations, regardless of whether a reply was
      // already received before — a customer can reply more than once
      // across the lifetime of a quotation (and its revisions), and every
      // reply should be logged, not just the first one.
      const { data: activeQuotations, error: quotationsError } = await supabase
        .from('quotations')
        .select('id, quotation_no, email, customer_name')
        .eq('status', 'Sent')
        .not('email', 'is', null);

      if (quotationsError) {
        logger.error('Reply monitor - quotations fetch error:', quotationsError);
        return;
      }

      if (!activeQuotations || activeQuotations.length === 0) {
        return;
      }

      // Primary lookup: by quotation number appearing in the subject line
      // (our outgoing subject is always "Quotation <quotation_no> - ...", so
      // a reply's "Re: ..." subject still contains the exact quotation_no).
      // This is precise even when a customer has several quotations pending
      // at once, unlike matching by email address alone.
      const quotationsByNumber = new Map();
      const quotationsByEmail = new Map();

      activeQuotations.forEach((quotation) => {
        if (quotation.quotation_no) {
          quotationsByNumber.set(quotation.quotation_no, quotation);
        }

        const email = (quotation.email || '').toLowerCase().trim();
        if (!email) return;

        if (!quotationsByEmail.has(email)) {
          quotationsByEmail.set(email, []);
        }

        quotationsByEmail.get(email).push(quotation);
      });

      const unseenUids = await client.search({ seen: false }, { uid: true });

      if (!unseenUids || unseenUids.length === 0) {
        return;
      }

      for await (const message of client.fetch(
        unseenUids,
        { envelope: true, source: true },
        { uid: true }
      )) {
        try {
          const subject = getSubject(message);
          const fromAddress = extractEmailAddress(message);

          let matchedQuotations = [];

          // Try precise subject-line match first.
          for (const [quotationNo, quotation] of quotationsByNumber.entries()) {
            if (subject.includes(quotationNo)) {
              matchedQuotations = [quotation];
              break;
            }
          }

          // Fall back to matching by sender email if the subject didn't
          // contain a recognizable quotation number (e.g. customer changed
          // the subject line, or replied via a different email flow).
          if (matchedQuotations.length === 0) {
            matchedQuotations = quotationsByEmail.get(fromAddress) || [];
          }

          if (matchedQuotations.length > 0) {
            let snippet = '';

            try {
              const parsed = await simpleParser(message.source);
              snippet = (parsed.text || '').trim().slice(0, 2000);
            } catch (parseError) {
              logger.error('Reply monitor - message parse error:', parseError);
            }

            for (const quotation of matchedQuotations) {
              const intentSummary = await summarizeReplyIntent(snippet, quotation);

              const { error: updateError } = await supabase
                .from('quotations')
                .update({
                  customer_replied: true,
                  replied_at: new Date().toISOString(),
                  reply_snippet: snippet.slice(0, 300) || null,
                  reply_intent: intentSummary,
                })
                .eq('id', quotation.id);

              if (updateError) {
                logger.error('Reply monitor - quotation update error:', updateError);
              }

              // Permanent record — never overwritten, so the full back-and-forth
              // with this customer stays available forever, even across
              // revisions and multiple replies.
              await logEvent(
                quotation.id,
                'customer_replied',
                `Customer replied${intentSummary ? ` (${intentSummary})` : ''}: ${
                  snippet || '(no readable text found in the email)'
                }`
              );

              logger.info(
                `Reply monitor - matched reply for quotation ${quotation.quotation_no} from ${fromAddress}${
                  intentSummary ? ` — intent: ${intentSummary}` : ''
                }`
              );
            }
          }

          await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
        } catch (messageError) {
          logger.error('Reply monitor - message processing error:', messageError);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    logger.error('Reply monitor - IMAP connection error:', error);

    try {
      await client.logout();
    } catch (logoutError) {
      // ignore - connection may already be closed
    }
  }
}

let monitorStarted = false;

export function startReplyMonitor() {
  if (monitorStarted) return;
  monitorStarted = true;

  logger.info(
    `Reply monitor starting - checking mailbox every ${REPLY_CHECK_INTERVAL_MS / 1000}s`
  );

  checkForReplies();

  setInterval(() => {
    checkForReplies();
  }, REPLY_CHECK_INTERVAL_MS);
}