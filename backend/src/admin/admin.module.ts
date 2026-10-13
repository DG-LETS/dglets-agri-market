import { Module }             from '@nestjs/common';
import { AdminService }        from './admin.service';
import { AdminController }     from './admin.controller';
import { PrismaModule }        from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LedgerModule }        from '../ledger/ledger.module';
import { CommissionModule }    from '../commission/commission.module';

@Module({
  imports:     [PrismaModule, NotificationsModule, LedgerModule, CommissionModule],
  controllers: [AdminController],
  providers:   [AdminService],
})
export class AdminModule {}
