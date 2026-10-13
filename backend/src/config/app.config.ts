import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv:    process.env.NODE_ENV    || 'development',
  port:       parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  apiPrefix:  process.env.API_PREFIX  || 'api',

  // ── Section 20 / 37: Configurable marketplace commission ──────────────
  // Do NOT hard-code 5% in application code. Read from environment.
  // Admin can override via SystemSetting (DB) at runtime.
  marketplaceCommissionRate: parseFloat(process.env.MARKETPLACE_COMMISSION_RATE || '0.05'),

  // ── Section 7: Payment processing fees — configurable, NOT hard-coded ─
  paymentProcessingFeeType:       process.env.PAYMENT_FEE_TYPE        || 'percentage', // 'percentage' | 'fixed' | 'percentage_with_cap'
  paymentProcessingPercentage:    parseFloat(process.env.PAYMENT_FEE_PERCENTAGE   || '0.015'), // e.g. Paystack 1.5%
  paymentProcessingFixedFee:      parseFloat(process.env.PAYMENT_FEE_FIXED        || '100'),   // NGN flat fee on transactions > ₦2,500
  paymentProcessingCap:           parseFloat(process.env.PAYMENT_FEE_CAP          || '2000'),  // Paystack cap ₦2,000

  // ── Section 35 / 3: Registration is FREE for all roles (MVP) ──────────
  // All registration fees are 0. The platform earns on transactions only.
  registrationFees: {
    FARMER:     0,
    TRADER:     0,
    AGGREGATOR: 0,
    PROCESSOR:  0,
    EXPORTER:   0,
    HAULAGE:    0,
    BUYER:      0,
    ADMIN:      0,
  } as Record<string, number>,

  // ── Haulage commission rate (fraction of logistics fee — kept separate) ─
  haulageCommissionRate: parseFloat(process.env.HAULAGE_COMMISSION_RATE || '0.10'),

  // ── Legacy aliases ────────────────────────────────────────────────────
  platformFeeRate: parseFloat(process.env.MARKETPLACE_COMMISSION_RATE || '0.05'),
  platformFeeMin:  0,
  platformFeeCap:  0,
}));
