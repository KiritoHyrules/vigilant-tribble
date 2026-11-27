import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
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

export class DecideReassignmentDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsIn(['approved', 'rejected'])
  outcome: 'approved' | 'rejected';

  @ApiPropertyOptional({
    description: 'New holder participant UUID (required when approved).',
  })
  @ValidateIf((o: DecideReassignmentDto) => o.outcome === 'approved')
  @IsUUID()
  newHolderId?: string;

  @ApiProperty({
    description: 'Justification for the decision (1-2000 chars).',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  justification: string;

  @ApiProperty({ enum: SOURCE_KINDS })
  @IsIn(SOURCE_KINDS)
  sourceKind: AllowedSourceKind;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(SOURCE_KEY_REGEX)
  sourceKey: string;
}
