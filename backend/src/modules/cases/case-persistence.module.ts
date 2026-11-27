import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaseRecord, CaseReference, IdentificationSpace } from './case.entity';
import { Responsibility } from './responsibility.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IdentificationSpace,
      CaseRecord,
      CaseReference,
      Responsibility,
    ]),
  ],
})
export class CasePersistenceModule {}
