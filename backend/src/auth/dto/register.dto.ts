import { IsString, IsEmail, IsOptional, IsEnum, MinLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RegisterRole {
  FARMER      = 'FARMER',
  BUYER       = 'BUYER',
  TRADER      = 'TRADER',
  AGGREGATOR  = 'AGGREGATOR',
  PROCESSOR   = 'PROCESSOR',
  EXPORTER    = 'EXPORTER',
  HAULAGE     = 'HAULAGE',
}

export class RegisterDto {
  @ApiProperty({ example: 'Musa' })
  @IsString() @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Abdullahi' })
  @IsString() @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '08012345678' })
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]{7,15}$/, { message: 'Invalid phone number' })
  phone: string;

  @ApiPropertyOptional({ example: 'musa@example.com' })
  @IsEmail() @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Password123!' })
  @IsString() @MinLength(8) @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: RegisterRole, default: RegisterRole.BUYER })
  @IsEnum(RegisterRole) @IsOptional()
  role?: RegisterRole;

  @ApiPropertyOptional({ example: 'REF123' })
  @IsString() @IsOptional()
  referralCode?: string;
}
