import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  CASE_SCOPES,
  NON_BLANK_REGEX,
  SOURCE_KEY_REGEX,
  SOURCE_KINDS,
  type AllowedSourceKind,
  type CaseScope,
} from '../cases.constants';

export class RequestReassignmentDto {
  @ApiProperty({ enum: CASE_SCOPES })
  @IsIn(CASE_SCOPES)
  scope: CaseScope;

  @ApiProperty({
    description: 'Motivation for the reassignment request (1-2000 chars).',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  reason: string;

  @ApiProperty({ enum: SOURCE_KINDS })
  @IsIn(SOURCE_KINDS)
  sourceKind: AllowedSourceKind;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(SOURCE_KEY_REGEX)
  sourceKey: string;
}
