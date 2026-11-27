import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AccessPolicy, DenyAllAccessPolicy } from './access-policy';
import { AuthenticatedGuard } from './authenticated.guard';

@Global()
@Module({
  providers: [
    { provide: AccessPolicy, useClass: DenyAllAccessPolicy },
    { provide: APP_GUARD, useClass: AuthenticatedGuard },
  ],
  exports: [AccessPolicy],
})
export class SecurityModule {}
