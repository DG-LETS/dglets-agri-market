import { IsString, IsUUID, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty() @IsUUID()   userId:  string;
  @ApiProperty() @IsString() token:   string;

  @ApiProperty({ enum: ['verify_phone', 'login', 'reset_password'] })
  @IsIn(['verify_phone', 'login', 'reset_password'])
  purpose: string;
}
