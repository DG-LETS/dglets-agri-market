import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with phone/email and password or request OTP' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Request a password reset OTP' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.phone);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.userId, dto.token, dto.newPassword);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  /* ── DEV ONLY: Activate user without OTP ── */
  @Get('dev-activate/:phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'DEV ONLY — activate user by phone without OTP' })
  async devActivate(
    @Param('phone') phone: string,
    @Query('secret') secret: string,
    @Query('role') role?: string,
    @Query('firstName') firstName?: string,
    @Query('lastName') lastName?: string,
    @Query('password') password?: string,
  ) {
    if (secret !== 'dglets-dev-2026') {
      return { error: 'Unauthorized' };
    }

    let user = await this.prisma.user.findUnique({ where: { phone } });

    /* If user doesn't exist and credentials provided, create them */
    if (!user && firstName && lastName && password) {
      const bcrypt = await import('bcrypt');
      const hash   = await bcrypt.hash(password, 12);
      user = await this.prisma.user.create({
        data: {
          phone,
          firstName,
          lastName,
          role:         (role as any) || 'BUYER',
          passwordHash: hash,
          referralCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
          status:       'PENDING_VERIFICATION',
          verification: { create: { phoneVerified: false } },
          rewardWallet: { create: {} },
        },
      });
    }

    if (!user) return { error: 'User not found' };

    /* Activate */
    await this.prisma.user.update({
      where: { id: user.id },
      data:  { status: 'ACTIVE', lastLoginAt: new Date() },
    });
    await this.prisma.verification.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, phoneVerified: true, emailVerified: false },
      update: { phoneVerified: true },
    });

    return {
      message:   `User ${user.firstName} ${user.lastName} (${user.role}) activated successfully`,
      phone:     user.phone,
      role:      user.role,
      activated: true,
    };
  }
}
