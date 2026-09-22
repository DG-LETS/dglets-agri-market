/**
 * DG-LETS — SMS Test (Termii + Twilio)
 * node test-sms.js 08070566642
 */
const fs    = require('fs');
const path  = require('path');
const https = require('https');

const env = {};
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=\s][^=]*?)\s*=\s*(.*)\s*$/);
    if (m) env[m[1].trim()] = m[2].trim();
  });
}

const TERMII_KEY  = process.env.TERMII_API_KEY    || env.TERMII_API_KEY    || '';
const BASE_URL    = (process.env.TERMII_BASE_URL  || env.TERMII_BASE_URL   || 'https://api.ng.termii.com').replace(/\/$/, '');
const TWILIO_SID  = process.env.TWILIO_ACCOUNT_SID || env.TWILIO_ACCOUNT_SID || '';
const TWILIO_TOK  = process.env.TWILIO_AUTH_TOKEN  || env.TWILIO_AUTH_TOKEN  || '';
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER || env.TWILIO_FROM_NUMBER || '';
const PHONE       = process.argv[2] || env.TEST_PHONE || '';

function normalise(p) {
  const d = p.replace(/\D/g, '');
  if (d.startsWith('234')) return d;
  if (d.startsWith('0'))   return '234' + d.slice(1);
  return d;
}

function post(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const isForm = headers['Content-Type']?.includes('urlencoded');
    const body   = isForm
      ? new URLSearchParams(payload).toString()
      : JSON.stringify(payload);
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end',  () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('\n🌾 DG-LETS — SMS Test\n');
  if (!PHONE) { console.error('Usage: node test-sms.js 08012345678'); return; }

  const target = normalise(PHONE);
  const otp    = Math.floor(100000 + Math.random() * 900000).toString();
  const msg    = `Your DG-LETS verification code is: ${otp}. Valid for 10 minutes. Do not share.`;

  console.log(`📱 Target : +${target}`);
  console.log(`🔑 OTP    : ${otp}\n`);

  /* ── Termii Token API ── */
  if (TERMII_KEY) {
    console.log('─── [1] Termii Token API ───');
    try {
      const r = await post(`${BASE_URL}/api/sms/otp/send`, {
        api_key: TERMII_KEY, message_type: 'NUMERIC',
        to: target, from: 'N-Alert', channel: 'generic',
        pin_attempts: 3, pin_time_to_live: 10, pin_length: 6,
        pin_placeholder: '< 1234 >',
        message_text: 'Your DG-LETS code is < 1234 >. Expires in 10 mins.',
      });
      console.log(`Status   : ${r.status}`);
      console.log('Response :', JSON.stringify(r.body, null, 2));
      if (r.body?.pinId) {
        console.log(`\n✅  TERMII TOKEN WORKS — check +${target} for OTP\n`);
        return;
      }
    } catch(e) { console.log('❌ Error:', e.message); }
    console.log('');
  }

  /* ── Twilio ── */
  if (TWILIO_SID && TWILIO_TOK && TWILIO_FROM) {
    console.log('─── [2] Twilio ───');
    const to  = `+${target}`;
    const cred = Buffer.from(`${TWILIO_SID}:${TWILIO_TOK}`).toString('base64');
    try {
      const r = await post(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        { To: to, From: TWILIO_FROM, Body: msg },
        { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Basic ${cred}` },
      );
      console.log(`Status   : ${r.status}`);
      console.log('Response :', JSON.stringify(r.body, null, 2));
      if (r.body?.sid) {
        console.log(`\n✅  TWILIO WORKS — check +${target} for OTP\n`);
        return;
      }
    } catch(e) { console.log('❌ Error:', e.message); }
    console.log('');
  } else {
    console.log('─── [2] Twilio — not configured ───');
    console.log('   Sign up free at https://twilio.com');
    console.log('   Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to .env\n');
  }

  console.log('❌  No SMS provider is working yet.');
  console.log('   Options:');
  console.log('   A) Wait for Termii support to activate Nigeria on your account (tomorrow morning 9am GMT+1)');
  console.log('   B) Sign up at twilio.com and add credentials to .env — works immediately\n');
}

main();
