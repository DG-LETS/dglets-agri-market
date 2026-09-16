import { Module } from '@nestjs/common';
import { HaulageService }    from './haulage.service';
import { HaulageController } from './haulage.controller';
import { PrismaModule }      from '../prisma/prisma.module';
import { FeesModule }        from '../fees/fees.module';

@Module({
  imports:     [PrismaModule, FeesModule],
  providers:   [HaulageService],
  controllers: [HaulageController],
  exports:     [HaulageService],
})
export class HaulageModule {}
