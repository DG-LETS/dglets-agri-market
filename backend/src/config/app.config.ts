import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv:    process.env.NODE_ENV    || 'development',
  port:       parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  apiPrefix:  process.env.API_PREFIX  || 'api',

  /* Platform transaction fee */
  platformFeeRate: parseFloat(process.env.PLATFORM_FEE_RATE || '0.0205'),
  platformFeeMin:  parseFloat(process.env.PLATFORM_FEE_MIN  || '200'),
  platformFeeCap:  parseFloat(process.env.PLATFORM_FEE_CAP  || '50000'),

  /* One-time registration fees per role (NGN) */
  registrationFees: {
    FARMER:     parseFloat(process.env.REGISTRATION_FEE_FARMER     || '2000'),
    TRADER:     parseFloat(process.env.REGISTRATION_FEE_TRADER     || '2000'),
    AGGREGATOR: parseFloat(process.env.REGISTRATION_FEE_AGGREGATOR || '2000'),
    PROCESSOR:  parseFloat(process.env.REGISTRATION_FEE_PROCESSOR  || '2000'),
    EXPORTER:   parseFloat(process.env.REGISTRATION_FEE_EXPORTER   || '5000'),
    HAULAGE:    parseFloat(process.env.REGISTRATION_FEE_HAULAGE    || '3000'),
    BUYER:      parseFloat(process.env.REGISTRATION_FEE_BUYER      || '0'),
    ADMIN:      0,
  } as Record<string, number>,

  /* Haulage commission rate (fraction of delivery fee) */
  haulageCommissionRate: parseFloat(process.env.HAULAGE_COMMISSION_RATE || '0.05'),
}));
