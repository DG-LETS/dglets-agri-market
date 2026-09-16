import { Module } from '@nestjs/common';
import { OrdersService }    from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule }     from '../prisma/prisma.module';
import { HaulageModule }    from '../haulage/haulage.module';
import { FeesModule }       from '../fees/fees.module';

@Module({
  imports:     [PrismaModule, HaulageModule, FeesModule],
  controllers: [OrdersController],
  providers:   [OrdersService],
  exports:     [OrdersService],
})
export class OrdersModule {}
