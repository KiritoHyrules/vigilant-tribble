import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CASE_SCOPES, type CaseScope } from '../cases.constants';

export class AssignInitialResponse {
  @ApiProperty() responsibilityId: string;
  @ApiProperty() caseId: string;
  @ApiProperty({ enum: CASE_SCOPES }) scope: CaseScope;
  @ApiProperty() holderId: string;
  @ApiProperty() startedAt: string;
}

export class StaleAttemptResponse {
  @ApiProperty() id: string;
  @ApiProperty() expectedResponsibilityId: string;
  @ApiPropertyOptional({ nullable: true })
  observedResponsibilityId: string | null;
  @ApiProperty() attemptedById: string;
  @ApiProperty() attemptedAt: string;
}

export class ReassignmentRequestItem {
  @ApiProperty() id: string;
  @ApiProperty() caseId: string;
  @ApiProperty({ enum: CASE_SCOPES }) scope: CaseScope;
  @ApiProperty() expectedResponsibilityId: string;
  @ApiProperty() requesterId: string;
  @ApiProperty() requesterName: string;
  @ApiProperty() reason: string;
  @ApiProperty() requestedAt: string;
  @ApiProperty() requiresTreatment: boolean;
  @ApiPropertyOptional({ nullable: true })
  treatmentStatus: 'superseded' | 'ineligible' | null;
  @ApiPropertyOptional({ nullable: true })
  predecessorId: string | null;
  @ApiPropertyOptional({ nullable: true })
  decisionOutcome: 'approved' | 'rejected' | null;
  @ApiPropertyOptional({ nullable: true }) decidedById: string | null;
  @ApiPropertyOptional({ nullable: true }) decidedAt: string | null;
  @ApiPropertyOptional({ nullable: true }) justification: string | null;
  @ApiPropertyOptional({ nullable: true })
  successorResponsibilityId: string | null;
}

export class ReassignmentRequestListResponse {
  @ApiProperty({ type: [ReassignmentRequestItem] })
  data: ReassignmentRequestItem[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}

export class ReassignmentRequestDetailResponse extends ReassignmentRequestItem {
  @ApiProperty({ type: [StaleAttemptResponse] })
  staleAttempts: StaleAttemptResponse[];
}

export class TreatReassignmentResponse {
  @ApiProperty() treatedRequestId: string;
  @ApiProperty({ enum: ['superseded', 'ineligible'] })
  treatmentStatus: 'superseded' | 'ineligible';
  @ApiPropertyOptional() newRequestId?: string;
}
