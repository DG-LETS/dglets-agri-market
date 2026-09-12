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

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const multerOpts = {
  storage: memoryStorage(),
  limits:  { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
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

  /* ── Upload single image ── */
  @Post('image')
  @ApiOperation({ summary: 'Upload a single image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', multerOpts))
  async uploadOne(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const folder = `dglets/${user.id}`;
    return this.upload.uploadImage(file.buffer, file.mimetype, folder);
  }

  /* ── Upload up to 5 product images ── */
  @Post('images')
  @ApiOperation({ summary: 'Upload up to 5 product images to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @UseInterceptors(FilesInterceptor('files', 5, multerOpts))
  async uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    const folder = `dglets/${user.id}/products`;
    const urls   = await this.upload.uploadImages(
      files.map(f => ({ buffer: f.buffer, mimetype: f.mimetype })),
      folder,
    );
    return { urls };
  }
}
