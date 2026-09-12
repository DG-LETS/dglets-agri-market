import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getMe(@CurrentUser() user: any) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateMe(@CurrentUser() user: any, @Body() body: any) {
    return this.users.updateProfile(user.id, body);
  }

  @Patch('me/farmer-profile')
  @ApiOperation({ summary: 'Update farmer profile' })
  updateFarmerProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.users.updateFarmerProfile(user.id, body);
  }

  @Patch('me/buyer-profile')
  @ApiOperation({ summary: 'Update buyer profile' })
  updateBuyerProfile(@CurrentUser() user: any, @Body() body: any) {
    return this.users.updateBuyerProfile(user.id, body);
  }
}
