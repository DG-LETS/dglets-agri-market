import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: '08012345678', description: 'Phone number or email' })
  @IsString()
  identifier: string;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Omit to receive OTP instead' })
  @IsString() @IsOptional()
  password?: string;
}
