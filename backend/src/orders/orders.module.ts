import { Module }             from '@nestjs/common';
import { OrdersService }       from './orders.service';
import { OrdersController }    from './orders.controller';
import { PrismaModule }        from '../prisma/prisma.module';
import { HaulageModule }       from '../haulage/haulage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LedgerModule }        from '../ledger/ledger.module';
import { CommissionModule }    from '../commission/commission.module';

@Module({
  imports:     [PrismaModule, HaulageModule, NotificationsModule, LedgerModule, CommissionModule],
  controllers: [OrdersController],
  providers:   [OrdersService],
  exports:     [OrdersService],
})
export class OrdersModule {}
