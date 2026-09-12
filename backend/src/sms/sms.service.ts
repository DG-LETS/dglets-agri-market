import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TermiiPayload {
  to:       string;
  from:     string;
  sms:      string;
  type:     'plain';
  channel:  'dnd' | 'generic' | 'whatsapp';
  api_key:  string;
}

interface TermiiResponse {
  message_id?: string;
  message:     string;
  balance:     number;
  user:        string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Send an SMS via Termii.
   * Falls back to console.log when TERMII_API_KEY is not configured (dev mode).
   */
  async send(phone: string, message: string): Promise<boolean> {
    const apiKey    = this.config.get<string>('TERMII_API_KEY', '');
    const senderId  = this.config.get<string>('TERMII_SENDER_ID', 'DG-LETS');
    const baseUrl   = this.config.get<string>('TERMII_BASE_URL', 'https://api.ng.termii.com');

    /* Dev / unconfigured — just log the OTP */
    if (!apiKey) {
      this.logger.warn(`[SMS DEV] To: ${phone} | Message: ${message}`);
      return true;
    }

    const normalised = this.normalisePhone(phone);
    const payload: TermiiPayload = {
      to:      normalised,
      from:    senderId,
      sms:     message,
      type:    'plain',
      channel: 'dnd',   // 'dnd' reaches DND numbers in Nigeria
      api_key: apiKey,
    };

    try {
      const response = await fetch(`${baseUrl}/api/sms/send`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const result = await response.json() as TermiiResponse;

      if (!response.ok || result.message?.toLowerCase().includes('error')) {
        this.logger.error(`Termii error — to: ${normalised}, message: ${result.message}`);
        return false;
      }

      this.logger.log(`SMS sent — to: ${normalised}, messageId: ${result.message_id}`);
      return true;
    } catch (err: any) {
      this.logger.error(`Termii request failed: ${err?.message}`);
      return false;
    }
  }

  /**
   * Normalise Nigerian phone numbers to international format.
   * 08012345678  → 2348012345678
   * +2348012345678 → 2348012345678
   */
  private normalisePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('234')) return digits;
    if (digits.startsWith('0'))   return `234${digits.slice(1)}`;
    return digits;
  }
}
