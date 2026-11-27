import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditEvent, AuditEventReadRef } from './audit.entity';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditEvent, AuditEventReadRef])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
