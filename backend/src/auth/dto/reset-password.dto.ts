import { IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ResetPasswordDto {
  @ApiProperty() @IsUUID()                userId:      string;
  @ApiProperty() @IsString()              token:       string;
  @ApiProperty() @IsString() @MinLength(8) newPassword: string;
}
