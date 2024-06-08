import { Module } from '@nestjs/common';
import { InitService } from './init.service';
import { InitController } from './init.controller';
import { UserModule } from '../user/user.module';
@Module({
  imports: [UserModule],
  controllers: [InitController],
  providers: [InitService],
  exports: [InitService],
})
export class InitModule {}
