import {
  Controller, Post, UseInterceptors, UploadedFile, UploadedFiles,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const multerOpts = {
  storage: memoryStorage(),
  limits:  { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new BadRequestException(`${file.originalname} is not a supported image type`), false);
  },
};

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'upload', version: '1' })
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload a single image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', multerOpts))
  async uploadOne(@UploadedFile() file: any, @CurrentUser() user: any): Promise<any> {
    if (!file) throw new BadRequestException('No file provided');
    return this.upload.uploadImage(file.buffer, file.mimetype, `dglets/${user.id}`);
  }

  @Post('images')
  @ApiOperation({ summary: 'Upload up to 5 product images to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @UseInterceptors(FilesInterceptor('files', 5, multerOpts))
  async uploadMany(@UploadedFiles() files: any[], @CurrentUser() user: any): Promise<any> {
    if (!files?.length) throw new BadRequestException('No files provided');
    const urls = await this.upload.uploadImages(
      files.map((f: any) => ({ buffer: f.buffer, mimetype: f.mimetype })),
      `dglets/${user.id}/products`,
    );
    return { urls };
  }
}
