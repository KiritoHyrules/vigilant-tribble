import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account, AuthSession } from './session.entity';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { LoginAdmission } from './login-admission';

@Module({
  imports: [TypeOrmModule.forFeature([Account, AuthSession])],
  controllers: [SessionController],
  providers: [SessionService, LoginAdmission],
  exports: [SessionService],
})
export class SessionModule {}
