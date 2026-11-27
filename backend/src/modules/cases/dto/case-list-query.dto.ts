import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CaseListQueryDto {
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

  @ApiPropertyOptional({ description: 'Filter by identification space code.' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  spaceCode?: string;

  @ApiPropertyOptional({
    description:
      'Search within reference match keys (substring, case-sensitive C collation).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Filter by active holder participant UUID.',
  })
  @IsOptional()
  @IsUUID()
  holderId?: string;

  @ApiPropertyOptional({
    description:
      'When true, filter cases missing at least one required scope holder.',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  unassigned?: boolean;

  @ApiPropertyOptional({
    enum: ['ordinary', 'special_route', 'unclassified'],
  })
  @IsOptional()
  @IsIn(['ordinary', 'special_route', 'unclassified'])
  classificationCode?: 'ordinary' | 'special_route' | 'unclassified';
}

export class IntakeListQueryDto {
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
    enum: ['confirmed', 'duplicate', 'collision', 'unresolved'],
  })
  @IsOptional()
  @IsIn(['confirmed', 'duplicate', 'collision', 'unresolved'])
  status?: 'confirmed' | 'duplicate' | 'collision' | 'unresolved';
}
