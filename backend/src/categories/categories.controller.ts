import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories' })
  findAll() { return this.categories.findAll(); }

  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  findOne(@Param('slug') slug: string) { return this.categories.findOne(slug); }
}
