import {
  Controller, Get, Post, Patch, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { HaulageService } from './haulage.service';
import { JwtAuthGuard }   from '../auth/guards/jwt-auth.guard';
import { CurrentUser }    from '../auth/decorators/current-user.decorator';

@Controller({ path: 'haulage', version: '1' })
@UseGuards(JwtAuthGuard)
export class HaulageController {
  constructor(private readonly haulage: HaulageService) {}

  /* ── Profile ── */

  /** POST /haulage/profile — create or update haulage profile */
  @Post('profile')
  upsertProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.haulage.createOrUpdateProfile(user.id, body);
  }

  /** GET /haulage/profile — get own haulage profile */
  @Get('profile')
  getProfile(@CurrentUser() user: any) {
    return this.haulage.getProfile(user.id);
  }

  /* ── Jobs ── */

  /** GET /haulage/jobs — list open delivery jobs */
  @Get('jobs')
  listJobs(
    @CurrentUser() user: any,
    @Query('state') state?: string,
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    return this.haulage.listJobs({
      state,
      page:   page  ? parseInt(page,  10) : 1,
      limit:  limit ? parseInt(limit, 10) : 20,
      userId: user.id,
    });
  }

  /** GET /haulage/jobs/my-applications — my application history */
  @Get('jobs/my-applications')
  myApplications(@CurrentUser() user: any) {
    return this.haulage.getMyApplications(user.id);
  }

  /** GET /haulage/jobs/my-active — my active/awarded jobs */
  @Get('jobs/my-active')
  myActiveJobs(@CurrentUser() user: any) {
    return this.haulage.getMyActiveJobs(user.id);
  }

  /** POST /haulage/jobs/:id/apply — apply for a job */
  @Post('jobs/:id/apply')
  @HttpCode(HttpStatus.CREATED)
  apply(
    @CurrentUser() user: any,
    @Param('id') jobId: string,
    @Body() body: { proposedFee?: number; note?: string },
  ) {
    return this.haulage.applyForJob(jobId, user.id, body);
  }

  /** GET /haulage/jobs/:id/applications — seller views applications for their job */
  @Get('jobs/:id/applications')
  getApplications(@CurrentUser() user: any, @Param('id') jobId: string) {
    return this.haulage.getJobApplications(jobId, user.id);
  }

  /** PATCH /haulage/jobs/:id/award/:applicationId — seller awards job */
  @Patch('jobs/:id/award/:applicationId')
  awardJob(
    @CurrentUser() user: any,
    @Param('id') jobId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.haulage.awardJob(jobId, applicationId, user.id);
  }

  /** PATCH /haulage/jobs/:id/complete — haulage provider marks delivered */
  @Patch('jobs/:id/complete')
  completeJob(@CurrentUser() user: any, @Param('id') jobId: string) {
    return this.haulage.completeJob(jobId, user.id);
  }
}
