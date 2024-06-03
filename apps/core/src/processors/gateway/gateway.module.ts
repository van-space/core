import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { AdminEventsGateway } from './admin/events.gateway';
import { SharedGateway } from './shared/events.gateway';
import { WebEventsGateway } from './web/events.gateway';

@Global()
@Module({
  imports: [AuthModule],
  providers: [AdminEventsGateway, WebEventsGateway, SharedGateway],
  exports: [AdminEventsGateway, WebEventsGateway, SharedGateway],
})
export class GatewayModule {}
