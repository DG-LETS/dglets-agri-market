import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret:          process.env.JWT_SECRET          || 'CHANGE_ME_IN_PRODUCTION',
  jwtExpiresIn:       process.env.JWT_EXPIRES_IN      || '7d',
  jwtRefreshSecret:   process.env.JWT_REFRESH_SECRET  || 'CHANGE_REFRESH_ME_IN_PRODUCTION',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  otpExpiresMinutes:  parseInt(process.env.OTP_EXPIRES_MINUTES || '10', 10),
  bcryptRounds:       parseInt(process.env.BCRYPT_ROUNDS       || '12', 10),
}));
