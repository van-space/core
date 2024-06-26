import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SECURITY } from '~/app.config';
import { AdminEventsGateway } from '../../processors/gateway/admin/events.gateway';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

export const __secret =
  SECURITY.jwtSecret || process.env.SECRET || 'asjhczxiucipoiopiqm2376';

const jwtModule = JwtModule.registerAsync({
  useFactory() {
    return {
      secret: __secret,
      signOptions: {
        expiresIn: SECURITY.jwtExpire,
        algorithm: 'HS256',
      },
    };
  },
});
@Module({
  imports: [PassportModule, jwtModule],
  providers: [AuthService, JwtStrategy, AdminEventsGateway],
  controllers: [AuthController],
  exports: [JwtStrategy, AuthService, jwtModule],
})
export class AuthModule {}
