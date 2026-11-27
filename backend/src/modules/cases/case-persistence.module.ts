import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CaseIncidence,
  CaseInstitutionalDocumentRef,
  CaseIntake,
} from './case-intake.entity';
import { CaseRecord, CaseReference, IdentificationSpace } from './case.entity';
import {
  ReassignmentRequest,
  ReassignmentStaleAttempt,
} from './reassignment-request.entity';
import { Responsibility } from './responsibility.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IdentificationSpace,
      CaseRecord,
      CaseReference,
      Responsibility,
      CaseIntake,
      CaseIncidence,
      CaseInstitutionalDocumentRef,
      ReassignmentRequest,
      ReassignmentStaleAttempt,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class CasePersistenceModule {}
