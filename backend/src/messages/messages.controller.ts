import {
  Controller, Get, Post, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard }    from '../auth/guards/jwt-auth.guard';
import { CurrentUser }     from '../auth/decorators/current-user.decorator';

@Controller({ path: 'messages', version: '1' })
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /* ── GET /messages — list my conversations (inbox) ── */
  @Get()
  getMyConversations(@CurrentUser() user: any) {
    return this.messages.getMyConversations(user.id);
  }

  /* ── GET /messages/unread — unread count for tab badge ── */
  @Get('unread')
  getUnreadCount(@CurrentUser() user: any) {
    return this.messages.getUnreadCount(user.id).then(count => ({ count }));
  }

  /* ── POST /messages/conversations — get or create a conversation ── */
  @Post('conversations')
  @HttpCode(HttpStatus.OK)
  getOrCreate(
    @CurrentUser() user: any,
    @Body() body: { recipientId: string; productId?: string; orderId?: string },
  ) {
    return this.messages.getOrCreateConversation(
      user.id,
      body.recipientId,
      body.productId,
      body.orderId,
    );
  }

  /* ── GET /messages/:conversationId — get messages in a conversation ── */
  @Get(':conversationId')
  getMessages(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    return this.messages.getMessages(
      conversationId,
      user.id,
      page  ? parseInt(page,  10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  /* ── POST /messages/:conversationId/send — send a message ── */
  @Post(':conversationId/send')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() body: { body: string },
  ) {
    return this.messages.sendMessage(conversationId, user.id, body.body);
  }

  /* ── POST /messages/:conversationId/report — report a user ── */
  @Post(':conversationId/report')
  @HttpCode(HttpStatus.OK)
  reportUser(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() body: { reportedId: string; reason: string },
  ) {
    return this.messages.reportUser(
      user.id,
      body.reportedId,
      conversationId,
      body.reason,
    );
  }
}
