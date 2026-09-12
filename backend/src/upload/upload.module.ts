import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService }    from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    /* Store files in memory (buffer) — we stream straight to Cloudinary */
    MulterModule.register({ storage: undefined }),
  ],
  controllers: [UploadController],
  providers:   [UploadService],
  exports:     [UploadService],
})
export class UploadModule {}
