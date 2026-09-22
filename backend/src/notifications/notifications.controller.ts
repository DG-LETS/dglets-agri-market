import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  findAll(
    @CurrentUser() user: any,
    @Query('page')  page?:  number,
    @Query('limit') limit?: number,
  ) {
    return this.notifications.getMyNotifications(user.id, page, limit);
  }

  /* ⚠️ Literal route MUST come before the parameterised :id route,
     otherwise NestJS would match "read-all" as the :id parameter. */
  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notifications.markRead(user.id, id);
  }
}
