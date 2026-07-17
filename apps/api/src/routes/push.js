import { Router } from 'express';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:sales@mrapexindustrial.in',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Frontend fetches this to know which public key to subscribe with.
router.get('/vapid-public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ success: false, error: 'Push not configured on the server yet' });
  }

  return res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Called once per device/browser when the owner taps "Enable Notifications".
router.post('/subscribe', async (req, res) => {
  try {
    const subscription = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, error: 'Invalid subscription payload' });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    );

    if (error) throw new Error(error.message);

    return res.json({ success: true });
  } catch (error) {
    console.error('PUSH SUBSCRIBE ERROR:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, error: 'endpoint is required' });
    }

    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return res.json({ success: true });
  } catch (error) {
    console.error('PUSH UNSUBSCRIBE ERROR:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Sends a push notification to EVERY subscribed device (desktop + mobile).
// Automatically prunes subscriptions that have expired/been revoked.
export async function sendPushToAll(title, body) {
  const { data: subs, error } = await supabase.from('push_subscriptions').select('*');

  if (error) {
    console.error('sendPushToAll fetch error:', error);
    return;
  }

  const payload = JSON.stringify({ title, body });

  await Promise.all(
    (subs || []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (pushError) {
        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          // Subscription is gone (browser data cleared, uninstalled, etc.)
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error('Push send error:', pushError.message);
        }
      }
    })
  );
}

// Used by n8n workflows (Reply Monitor, new-enquiry notifier) to trigger a
// push notification from the background, without needing the dashboard open.
router.post('/send', async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    await sendPushToAll(title, body || '');

    return res.json({ success: true });
  } catch (error) {
    console.error('PUSH SEND ERROR:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;