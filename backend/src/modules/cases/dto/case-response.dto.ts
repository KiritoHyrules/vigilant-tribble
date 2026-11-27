import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HolderResponse {
  @ApiProperty() participantId: string;
  @ApiProperty() displayName: string;
  @ApiProperty({ enum: ['analyst', 'vocal'] }) scope: 'analyst' | 'vocal';
  @ApiProperty() startedAt: string;
}

export class ReferenceResponse {
  @ApiProperty() id: string;
  @ApiProperty() spaceCode: string;
  @ApiProperty() originalReference: string;
  @ApiProperty() isPrimary: boolean;
  @ApiProperty() confirmedAt: string;
}

export class ResponsibilityHistoryItem {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['analyst', 'vocal'] }) scope: 'analyst' | 'vocal';
  @ApiProperty() holderId: string;
  @ApiProperty() holderName: string;
  @ApiProperty() startedAt: string;
  @ApiPropertyOptional({ nullable: true }) endedAt: string | null;
}

export class IncidenceResponse {
  @ApiProperty() id: string;
  @ApiProperty() incidenceKind: string;
  @ApiProperty() summary: string;
  @ApiProperty({ enum: ['open', 'resolved'] }) status: 'open' | 'resolved';
  @ApiProperty() recordedAt: string;
  @ApiPropertyOptional({ nullable: true }) resolvedAt: string | null;
  @ApiPropertyOptional({ nullable: true }) resolutionNote: string | null;
}

export class InstitutionalDocumentRefResponse {
  @ApiProperty() id: string;
  @ApiProperty() spaceCode: string;
  @ApiProperty() externalReference: string;
  @ApiProperty() documentKind: string;
  @ApiPropertyOptional({ nullable: true }) summary: string | null;
  @ApiProperty() receivedAt: string;
}

export class CaseReadinessResponse {
  @ApiProperty({ enum: ['ordinary', 'special_route', 'missing'] })
  classificationStatus: 'ordinary' | 'special_route' | 'missing';

  @ApiProperty({ type: [String] })
  missingScopes: ('analyst' | 'vocal')[];

  @ApiProperty()
  ordinaryAnalysisReady: boolean;
}

export class CaseListItem {
  @ApiProperty() id: string;
  @ApiPropertyOptional({ nullable: true })
  classificationCode: 'ordinary' | 'special_route' | null;
  @ApiPropertyOptional({ nullable: true }) operationalSummary: string | null;
  @ApiProperty() incorporatedAt: string;
  @ApiProperty() updatedAt: string;
  @ApiPropertyOptional({ type: ReferenceResponse })
  primaryReference?: ReferenceResponse;
  @ApiProperty({ type: [HolderResponse] }) currentHolders: HolderResponse[];
  @ApiProperty({ type: CaseReadinessResponse })
  readiness: CaseReadinessResponse;
}

export class CaseListResponse {
  @ApiProperty({ type: [CaseListItem] }) data: CaseListItem[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}

export class CaseDetailResponse extends CaseListItem {
  @ApiProperty({ type: [ReferenceResponse] }) references: ReferenceResponse[];
  @ApiProperty({ type: [ResponsibilityHistoryItem] })
  responsibilityHistory: ResponsibilityHistoryItem[];
  @ApiProperty({ type: [IncidenceResponse] }) incidences: IncidenceResponse[];
  @ApiProperty({ type: [InstitutionalDocumentRefResponse] })
  institutionalDocuments: InstitutionalDocumentRefResponse[];
}

export class IncorporateCaseResponse {
  @ApiProperty({ enum: ['confirmed', 'unresolved'] })
  outcome: 'confirmed' | 'unresolved';
  @ApiProperty() intakeId: string;
  @ApiPropertyOptional() caseId?: string;
  @ApiPropertyOptional() referenceId?: string;
  @ApiPropertyOptional() incidenceId?: string;
  @ApiPropertyOptional() reason?: string;
}

export class IntakeListItem {
  @ApiProperty() id: string;
  @ApiProperty({ enum: ['confirmed', 'duplicate', 'collision', 'unresolved'] })
  status: 'confirmed' | 'duplicate' | 'collision' | 'unresolved';
  @ApiProperty() spaceCode: string;
  @ApiProperty() originalReference: string;
  @ApiPropertyOptional({ nullable: true }) detail: string | null;
  @ApiPropertyOptional({ nullable: true }) caseId: string | null;
  @ApiProperty() receivedAt: string;
}

export class IntakeListResponse {
  @ApiProperty({ type: [IntakeListItem] }) data: IntakeListItem[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
