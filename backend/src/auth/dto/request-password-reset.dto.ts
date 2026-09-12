import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RequestPasswordResetDto {
  @ApiProperty({ example: '08012345678' }) @IsString() phone: string;
}
