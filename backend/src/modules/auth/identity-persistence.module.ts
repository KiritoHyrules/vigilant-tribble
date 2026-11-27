import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant, ParticipantRole, Role } from './identity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Participant, Role, ParticipantRole])],
})
export class IdentityPersistenceModule {}
