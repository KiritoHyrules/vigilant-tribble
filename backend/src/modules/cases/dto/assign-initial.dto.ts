import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';
import {
  CASE_SCOPES,
  SOURCE_KEY_REGEX,
  SOURCE_KINDS,
  type AllowedSourceKind,
  type CaseScope,
} from '../cases.constants';

export class AssignInitialDto {
  @ApiProperty({ description: 'Participant UUID to assign as holder.' })
  @IsUUID()
  holderId: string;

  @ApiProperty({ enum: CASE_SCOPES })
  @IsIn(CASE_SCOPES)
  scope: CaseScope;

  @ApiProperty({ enum: SOURCE_KINDS })
  @IsIn(SOURCE_KINDS)
  sourceKind: AllowedSourceKind;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(SOURCE_KEY_REGEX)
  sourceKey: string;
}
