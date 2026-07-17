import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FOLLOW_UP_CHECK_INTERVAL_MS = Number(
  process.env.FOLLOW_UP_CHECK_INTERVAL_MS || 3600000 // default: every 1 hour
);

const FOLLOW_UP_DELAY_HOURS = Number(process.env.FOLLOW_UP_DELAY_HOURS || 72); // default: 3 days
const MAX_FOLLOW_UPS = Number(process.env.MAX_FOLLOW_UPS || 2);

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
      logger.error('Follow-up monitor - failed to log event:', error);
    }
  } catch (error) {
    logger.error('Follow-up monitor - failed to log event:', error);
  }
}

async function sendFollowUpEmail(quotation) {
  const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: process.env.FROM_NAME || 'MR Apex Industrial Components',
        email: process.env.FROM_EMAIL || 'sales@mrapexindustrial.in',
      },
      to: [
        {
          email: quotation.email,
          name: quotation.customer_name || 'Customer',
        },
      ],
      subject: `Following up - Quotation ${quotation.quotation_no}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; color:#111827;">
          <p>Dear ${escapeHtml(quotation.customer_name || 'Customer')},</p>
          <p>We wanted to follow up on quotation <b>${escapeHtml(
            quotation.quotation_no
          )}</b> we sent earlier. Please let us know if you have any questions or need any changes.</p>
          <p>We would be happy to assist further and finalize this at the earliest.</p>
          <p>Regards,<br/><b>MR Apex Industrial Components</b></p>
        </div>
      `,
    }),
  });

  const brevoResult = await brevoResponse.json();

  if (!brevoResponse.ok) {
    throw new Error(brevoResult.message || 'Brevo follow-up email send failed');
  }

  return brevoResult;
}

async function checkForFollowUps() {
  try {
    const cutoffTime = new Date(
      Date.now() - FOLLOW_UP_DELAY_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { data: candidateQuotations, error } = await supabase
      .from('quotations')
      .select(
        'id, quotation_no, customer_name, email, status, sent_at, customer_replied, follow_up_count, last_follow_up_at'
      )
      .eq('status', 'Sent')
      .or('customer_replied.is.null,customer_replied.eq.false')
      .not('email', 'is', null)
      .lt('sent_at', cutoffTime);

    if (error) {
      logger.error('Follow-up monitor - quotations fetch error:', error);
      return;
    }

    if (!candidateQuotations || candidateQuotations.length === 0) {
      return;
    }

    for (const quotation of candidateQuotations) {
      const followUpCount = Number(quotation.follow_up_count || 0);

      if (followUpCount >= MAX_FOLLOW_UPS) {
        continue;
      }

      // If a follow-up was already sent recently, wait for the next delay window before sending another
      if (quotation.last_follow_up_at) {
        const lastFollowUpTime = new Date(quotation.last_follow_up_at).getTime();
        const nextAllowedTime = lastFollowUpTime + FOLLOW_UP_DELAY_HOURS * 60 * 60 * 1000;

        if (Date.now() < nextAllowedTime) {
          continue;
        }
      }

      try {
        await sendFollowUpEmail(quotation);

        const { error: updateError } = await supabase
          .from('quotations')
          .update({
            follow_up_count: followUpCount + 1,
            last_follow_up_at: new Date().toISOString(),
          })
          .eq('id', quotation.id);

        if (updateError) {
          logger.error('Follow-up monitor - quotation update error:', updateError);
        } else {
          logger.info(
            `Follow-up monitor - sent follow-up #${followUpCount + 1} for quotation ${
              quotation.quotation_no
            }`
          );
        }

        await logEvent(
          quotation.id,
          'follow_up_sent',
          `Follow-up reminder #${followUpCount + 1} emailed to the customer (no reply had been received yet).`
        );
      } catch (sendError) {
        logger.error(
          `Follow-up monitor - failed to send follow-up for quotation ${quotation.quotation_no}:`,
          sendError
        );
      }
    }
  } catch (error) {
    logger.error('Follow-up monitor - unexpected error:', error);
  }
}

let monitorStarted = false;

export function startFollowUpMonitor() {
  if (monitorStarted) return;
  monitorStarted = true;

  logger.info(
    `Follow-up monitor starting - checking every ${
      FOLLOW_UP_CHECK_INTERVAL_MS / 1000
    }s, delay ${FOLLOW_UP_DELAY_HOURS}h, max ${MAX_FOLLOW_UPS} follow-ups`
  );

  checkForFollowUps();

  setInterval(() => {
    checkForFollowUps();
  }, FOLLOW_UP_CHECK_INTERVAL_MS);
}