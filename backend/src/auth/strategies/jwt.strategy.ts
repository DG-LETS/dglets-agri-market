import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config:  ConfigService,
    private readonly prisma:  PrismaService,
  ) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      config.get<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: { sub: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where:   { id: payload.sub },
      select:  { id: true, role: true, status: true, firstName: true, lastName: true, phone: true, email: true },
    });
    if (!user || user.status === 'SUSPENDED') {
      throw new UnauthorizedException();
    }
    return user;
  }
}
