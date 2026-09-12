import {
  Controller, Post, UseInterceptors, UploadedFile, UploadedFiles,
  UseGuards, BadRequestException, ParseFilePipe, MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB per image

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
  @UseInterceptors(FileInterceptor('file'))
  async uploadOne(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_SIZE_BYTES }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const folder = `dglets/${user.id}`;
    return this.upload.uploadImage(file.buffer, file.mimetype, folder);
  }

  /* ── Upload up to 5 product images ── */
  @Post('images')
  @ApiOperation({ summary: 'Upload up to 5 product images to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: any,
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');

    for (const f of files) {
      if (f.size > MAX_SIZE_BYTES)            throw new BadRequestException(`${f.originalname} exceeds 5 MB`);
      if (!/^image\/(jpeg|png|webp|gif)$/.test(f.mimetype))
        throw new BadRequestException(`${f.originalname} is not a supported image type`);
    }

    const folder = `dglets/${user.id}/products`;
    const urls   = await this.upload.uploadImages(
      files.map(f => ({ buffer: f.buffer, mimetype: f.mimetype })),
      folder,
    );
    return { urls };
  }
}
