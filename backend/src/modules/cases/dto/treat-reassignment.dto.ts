import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {
  NON_BLANK_REGEX,
  SOURCE_KEY_REGEX,
  SOURCE_KINDS,
  type AllowedSourceKind,
} from '../cases.constants';

export class TreatReassignmentDto {
  @ApiProperty({ enum: ['superseded', 'ineligible'] })
  @IsIn(['superseded', 'ineligible'])
  outcome: 'superseded' | 'ineligible';

  @ApiProperty({ description: 'Treatment note (1-2000 chars).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  treatmentNote: string;

  @ApiPropertyOptional({
    description:
      'Motivation for the new linked reassignment request (required when outcome is superseded).',
  })
  @ValidateIf((o: TreatReassignmentDto) => o.outcome === 'superseded')
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  newReason?: string;

  @ApiProperty({ enum: SOURCE_KINDS })
  @IsIn(SOURCE_KINDS)
  sourceKind: AllowedSourceKind;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(SOURCE_KEY_REGEX)
  sourceKey: string;
}
