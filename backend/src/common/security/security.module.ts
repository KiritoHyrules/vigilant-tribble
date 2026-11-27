import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SessionModule } from '../../modules/auth/session.module';
import { AccessPolicy } from './access-policy';
import { ResourceAccessPolicy } from './resource-access.policy';
import { AuthenticatedGuard } from './authenticated.guard';

@Global()
@Module({
  imports: [SessionModule],
  providers: [
    { provide: AccessPolicy, useClass: ResourceAccessPolicy },
    { provide: APP_GUARD, useClass: AuthenticatedGuard },
  ],
  exports: [AccessPolicy],
})
export class SecurityModule {}
