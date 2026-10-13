import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RfqService } from './rfq.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('RFQ & Buyer Requests')
@Controller('rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Get('requests')
  @ApiOperation({ summary: 'List open buyer requests / RFQs' })
  getRequests(
    @Query('cropCategory') cropCategory?: string,
    @Query('status') status?: string,
  ) {
    return this.rfqService.getRequests({ cropCategory, status });
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get buyer request details and submitted offers' })
  getRequestById(@Param('id') id: string) {
    return this.rfqService.getRequestById(id);
  }

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new buyer request (RFQ)' })
  createRequest(@Request() req: any, @Body() body: any) {
    return this.rfqService.createRequest(req.user.id, body);
  }

  @Patch('requests/:id/close')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a buyer request' })
  closeRequest(@Request() req: any, @Param('id') id: string) {
    return this.rfqService.closeRequest(req.user.id, id);
  }

  @Post('requests/:id/offers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit an offer/quote for an RFQ (Sellers)' })
  createOffer(
    @Request() req: any,
    @Param('id') requestId: string,
    @Body() body: any,
  ) {
    return this.rfqService.createOffer(req.user.id, requestId, body);
  }

  @Get('my-offers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user submitted offers' })
  getMyOffers(@Request() req: any) {
    return this.rfqService.getSellerOffers(req.user.id);
  }

  @Patch('offers/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a seller offer for an RFQ (Buyer)' })
  acceptOffer(@Request() req: any, @Param('id') offerId: string) {
    return this.rfqService.acceptOffer(req.user.id, offerId);
  }
}
