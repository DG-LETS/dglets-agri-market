import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports:   [PrismaModule],
  providers: [FeesService],
  controllers: [FeesController],
  exports:   [FeesService],   /* exported so AuthModule + HaulageModule can inject it */
})
export class FeesModule {}
