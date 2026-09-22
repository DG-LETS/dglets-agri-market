import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SmsService — Multi-provider OTP delivery
 *
 * Strategy (tried in order until one succeeds):
 *  1. Termii Token API  (generic channel) — no sender ID needed
 *  2. Termii SMS API    (requires approved sender ID)
 *  3. Twilio            (fallback — works in Nigeria immediately)
 *  4. Dev/mock          (console log when no keys configured)
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  async send(phone: string, message: string): Promise<boolean> {
    const termiiKey = this.config.get<string>('TERMII_API_KEY', '');
    const twilioSid = this.config.get<string>('TWILIO_ACCOUNT_SID', '');

    /* Dev mode — no providers configured */
    if (!termiiKey && !twilioSid) {
      this.logger.warn(`[SMS DEV] To: ${phone} | ${message}`);
      return true;
    }

    const normalised = this.normalisePhone(phone);

    /* ── 1. Termii Token API ── */
    if (termiiKey) {
      const ok = await this.sendTermiiToken(termiiKey, normalised, message);
      if (ok) return true;

      /* ── 2. Termii SMS API ── */
      const ok2 = await this.sendTermiiSms(termiiKey, normalised, message);
      if (ok2) return true;
    }

    /* ── 3. Twilio ── */
    if (twilioSid) {
      const ok = await this.sendTwilio(normalised, message);
      if (ok) return true;
    }

    this.logger.error(`[SMS] All providers failed for ${normalised}`);
    return false;
  }

  /* ─────────────────────────────────────────────────────────
     Termii Token API — no custom Sender ID needed
  ───────────────────────────────────────────────────────── */
  private async sendTermiiToken(apiKey: string, phone: string, message: string): Promise<boolean> {
    const baseUrl = this.config.get<string>('TERMII_BASE_URL', 'https://api.ng.termii.com');
    const otp     = message.match(/\b(\d{6})\b/)?.[1];
    if (!otp) return false;

    try {
      const res = await fetch(`${baseUrl}/api/sms/otp/send`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key:          apiKey,
          message_type:     'NUMERIC',
          to:               phone,
          from:             'N-Alert',
          channel:          'generic',
          pin_attempts:     3,
          pin_time_to_live: 10,
          pin_length:       6,
          pin_placeholder:  '< 1234 >',
          message_text:     'Your DG-LETS verification code is < 1234 >. Valid for 10 minutes. Do not share.',
        }),
      });
      const result = await res.json() as any;
      if (result?.pinId) {
        this.logger.log(`[SMS Termii Token] Sent to ${phone} — pinId: ${result.pinId}`);
        return true;
      }
      this.logger.warn(`[SMS Termii Token] Failed: ${result?.message ?? JSON.stringify(result)}`);
      return false;
    } catch (err: any) {
      this.logger.warn(`[SMS Termii Token] Error: ${err?.message}`);
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────
     Termii SMS API — requires approved Sender ID
  ───────────────────────────────────────────────────────── */
  private async sendTermiiSms(apiKey: string, phone: string, message: string): Promise<boolean> {
    const baseUrl  = this.config.get<string>('TERMII_BASE_URL', 'https://api.ng.termii.com');
    const senderId = this.config.get<string>('TERMII_SENDER_ID', 'N-Alert');

    try {
      const res = await fetch(`${baseUrl}/api/sms/send`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to:      phone,
          from:    senderId,
          sms:     message,
          type:    'plain',
          channel: 'generic',
          api_key: apiKey,
        }),
      });
      const result = await res.json() as any;
      if (result?.message_id) {
        this.logger.log(`[SMS Termii] Sent to ${phone} — messageId: ${result.message_id}`);
        return true;
      }
      this.logger.warn(`[SMS Termii] Failed: ${result?.message ?? JSON.stringify(result)}`);
      return false;
    } catch (err: any) {
      this.logger.warn(`[SMS Termii] Error: ${err?.message}`);
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────
     Twilio — works in Nigeria immediately, no sender approval
     Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
  ───────────────────────────────────────────────────────── */
  private async sendTwilio(phone: string, message: string): Promise<boolean> {
    const sid      = this.config.get<string>('TWILIO_ACCOUNT_SID', '');
    const token    = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    const fromNum  = this.config.get<string>('TWILIO_FROM_NUMBER', '');

    if (!sid || !token || !fromNum) {
      this.logger.warn('[SMS Twilio] Credentials not configured');
      return false;
    }

    /* Twilio expects E.164: +2348012345678 */
    const to = phone.startsWith('+') ? phone : `+${phone}`;

    try {
      const credentials = Buffer.from(`${sid}:${token}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method:  'POST',
          headers: {
            Authorization:  `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ To: to, From: fromNum, Body: message }).toString(),
        },
      );
      const result = await res.json() as any;
      if (result?.sid) {
        this.logger.log(`[SMS Twilio] Sent to ${to} — sid: ${result.sid}`);
        return true;
      }
      this.logger.warn(`[SMS Twilio] Failed: ${result?.message ?? JSON.stringify(result)}`);
      return false;
    } catch (err: any) {
      this.logger.warn(`[SMS Twilio] Error: ${err?.message}`);
      return false;
    }
  }

  /* ─────────────────────────────────────────────────────────
     Normalise Nigerian phone → international format
     08012345678 → 2348012345678
  ───────────────────────────────────────────────────────── */
  private normalisePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('234')) return digits;
    if (digits.startsWith('0'))   return `234${digits.slice(1)}`;
    return digits;
  }
}
