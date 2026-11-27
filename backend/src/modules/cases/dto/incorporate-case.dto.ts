import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {
  NO_CONTROL_CHARS_REGEX,
  NON_BLANK_REGEX,
  NON_SPACE_ONLY_REGEX,
  SOURCE_KEY_REGEX,
  SOURCE_KINDS,
  type AllowedSourceKind,
} from '../cases.constants';

export class IncorporateInstitutionalDocDto {
  @ApiProperty({
    description:
      'External institutional document reference (1-256 UTF-8 bytes, no control chars).',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Matches(NO_CONTROL_CHARS_REGEX, {
    message: 'Must not contain control characters.',
  })
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  externalReference: string;

  @ApiProperty({ description: 'Institutional document kind label.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  documentKind: string;

  @ApiPropertyOptional({
    description: 'Optional summary of received document reference.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  summary?: string;
}

export class IncorporateCaseDto {
  @ApiProperty({
    description: 'Identification space code for the primary reference.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  spaceCode: string;

  @ApiProperty({
    description:
      'Original institutional reference (preserved verbatim; >256 UTF-8 bytes retained in intake as unresolved).',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  @Matches(NO_CONTROL_CHARS_REGEX, {
    message: 'Must not contain control characters.',
  })
  @Matches(NON_SPACE_ONLY_REGEX, {
    message: 'Reference match key must not be empty.',
  })
  originalReference: string;

  @ApiPropertyOptional({ enum: ['ordinary', 'special_route'] })
  @IsOptional()
  @IsIn(['ordinary', 'special_route'])
  classificationCode?: 'ordinary' | 'special_route';

  @ApiPropertyOptional({
    description: 'Operational summary (1-1000 chars when present).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  operationalSummary?: string;

  @ApiPropertyOptional({
    description:
      'Optional institutional evidence fingerprint used to check concordance on duplicate keys.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  @Matches(NON_BLANK_REGEX, { message: 'Must not be blank.' })
  concordanceKey?: string;

  @ApiProperty({ enum: SOURCE_KINDS })
  @IsIn(SOURCE_KINDS)
  sourceKind: AllowedSourceKind;

  @ApiProperty({ description: 'Source key identifying the origin.' })
  @IsString()
  @IsNotEmpty()
  @Matches(SOURCE_KEY_REGEX)
  sourceKey: string;

  @ApiPropertyOptional({ type: [IncorporateInstitutionalDocDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => IncorporateInstitutionalDocDto)
  institutionalDocuments?: IncorporateInstitutionalDocDto[];
}
