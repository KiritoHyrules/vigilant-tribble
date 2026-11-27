import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AssignmentsService } from './assignments.service';
import { CasePersistenceModule } from './case-persistence.module';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { ReassignmentsController } from './reassignments.controller';

@Module({
  imports: [CasePersistenceModule, AuditModule],
  controllers: [CasesController, ReassignmentsController],
  providers: [CasesService, AssignmentsService],
  exports: [CasesService, AssignmentsService],
})
export class CasesModule {}
