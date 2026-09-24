const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  },
  body: JSON.stringify(body),
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Method not allowed.' });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { ok: false, message: 'Invalid request body.' });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  const consent = payload.consent === true;
  const honeypot = String(payload.company || '').trim();
  const pagePath = String(payload.page_path || '/').slice(0, 240);
  const referrer = String(payload.referrer || event.headers.referer || '').slice(0, 500);

  // If a bot fills the hidden field, pretend success without touching beehiiv.
  if (honeypot) {
    return json(200, { ok: true, message: 'You are in. Check your inbox for Rise Weekly.' });
  }

  if (!isValidEmail(email)) {
    return json(400, { ok: false, message: 'Enter a valid email address.' });
  }

  if (!consent) {
    return json(400, { ok: false, message: 'Consent is required to join Rise Weekly.' });
  }

  const apiKey = process.env.BEEHIIV_API_KEY;
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID || 'pub_babdd085-ee58-43a5-9841-fd11b4cb743a';
  const sendWelcomeEmail = process.env.BEEHIIV_SEND_WELCOME_EMAIL !== 'false';

  if (!apiKey) {
    return json(500, { ok: false, message: 'Newsletter is not configured yet.' });
  }

  const beehiivPayload = {
    email,
    reactivate_existing: false,
    send_welcome_email: sendWelcomeEmail,
    double_opt_override: 'not_set',
    utm_source: 'riseklix-main-site',
    utm_medium: 'footer-newsletter',
    utm_campaign: 'rise-weekly',
    referring_site: referrer || `https://riseklix.com${pagePath}`,
  };

  try {
    const response = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(beehiivPayload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const raw = JSON.stringify(data).toLowerCase();
      if (response.status === 409 || raw.includes('already') || raw.includes('duplicate')) {
        return json(200, { ok: true, message: 'You are already on Rise Weekly.' });
      }
      console.error('beehiiv subscription error', response.status, data);
      return json(response.status >= 500 ? 502 : 400, {
        ok: false,
        message: 'Could not add this email to Rise Weekly right now.',
      });
    }

    return json(200, {
      ok: true,
      message: sendWelcomeEmail ? 'You are in. Check your inbox for Rise Weekly.' : 'You are in. Welcome to Rise Weekly.',
      subscription_id: data?.data?.id || null,
      status: data?.data?.status || null,
    });
  } catch (error) {
    console.error('beehiiv request failed', error);
    return json(502, { ok: false, message: 'Could not reach the newsletter service right now.' });
  }
};
