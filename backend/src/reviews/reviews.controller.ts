import {
  Controller, Post, Get, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard }   from '../auth/guards/jwt-auth.guard';
import { CurrentUser }    from '../auth/decorators/current-user.decorator';

@Controller({ path: 'reviews', version: '1' })
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  /** POST /reviews — submit a review (order or haulage job) */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: any, @Body() body: {
    orderId?:      string;
    haulageJobId?: string;
    subjectId:     string;
    productId?:    string;
    rating:        number;
    comment?:      string;
    tags?:         string[];
  }) {
    return this.reviews.create(user.id, body);
  }

  /** GET /reviews/subject/:userId — all reviews for a user (seller / haulage profile) */
  @Get('subject/:userId')
  getForSubject(
    @Param('userId') userId: string,
    @Query('page')   page?:  string,
    @Query('limit')  limit?: string,
  ) {
    return this.reviews.getForSubject(userId, page ? +page : 1, limit ? +limit : 20);
  }

  /** GET /reviews/check?orderId=xxx — did current user already review this order? */
  @Get('check')
  hasReviewed(@CurrentUser() user: any, @Query('orderId') orderId: string) {
    return this.reviews.hasReviewed(user.id, orderId);
  }
}
