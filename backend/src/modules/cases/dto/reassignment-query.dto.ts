import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { CASE_SCOPES, type CaseScope } from '../cases.constants';

export class ReassignmentListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: [
      'pending',
      'requires_treatment',
      'approved',
      'rejected',
      'superseded',
      'ineligible',
    ],
  })
  @IsOptional()
  @IsIn([
    'pending',
    'requires_treatment',
    'approved',
    'rejected',
    'superseded',
    'ineligible',
  ])
  status?:
    | 'pending'
    | 'requires_treatment'
    | 'approved'
    | 'rejected'
    | 'superseded'
    | 'ineligible';

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  caseId?: string;

  @ApiPropertyOptional({ enum: CASE_SCOPES })
  @IsOptional()
  @IsIn(CASE_SCOPES)
  scope?: CaseScope;
}
