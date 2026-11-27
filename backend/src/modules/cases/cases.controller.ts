import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Actor, type CurrentActor } from '../../common/security/current-actor';
import { AssignmentsService } from './assignments.service';
import { CasesService } from './cases.service';
import { AssignInitialDto } from './dto/assign-initial.dto';
import {
  CaseListQueryDto,
  IntakeListQueryDto,
} from './dto/case-list-query.dto';
import {
  CaseDetailResponse,
  CaseListResponse,
  IncorporateCaseResponse,
  IntakeListResponse,
} from './dto/case-response.dto';
import { IncorporateCaseDto } from './dto/incorporate-case.dto';
import {
  AssignInitialResponse,
  ReassignmentRequestItem,
} from './dto/reassignment-response.dto';
import { RequestReassignmentDto } from './dto/request-reassignment.dto';

@ApiTags('cases')
@ApiUnauthorizedResponse({ description: 'Authentication required.' })
@ApiForbiddenResponse({ description: 'Denied by authorization policy.' })
@Controller('cases')
export class CasesController {
  constructor(
    private readonly cases: CasesService,
    private readonly assignments: AssignmentsService,
  ) {}

  @Post('incorporate')
  @ApiOperation({
    summary: 'Incorporate a case or persist an unresolved intake item',
  })
  @ApiCreatedResponse({ type: IncorporateCaseResponse })
  @ApiAcceptedResponse({
    type: IncorporateCaseResponse,
    description: 'Persisted intact in intake as unresolved.',
  })
  @ApiConflictResponse({ description: 'Duplicate or collision detected.' })
  async incorporate(
    @Actor() actor: CurrentActor,
    @Body() body: IncorporateCaseDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IncorporateCaseResponse> {
    const result = await this.cases.incorporateCase(actor, body);
    res.status(result.outcome === 'confirmed' ? 201 : 202);
    return result;
  }

  @Get('intake')
  @ApiOperation({ summary: 'List authorized intake submissions' })
  @ApiOkResponse({ type: IntakeListResponse })
  listIntake(
    @Actor() actor: CurrentActor,
    @Query() query: IntakeListQueryDto,
  ): Promise<IntakeListResponse> {
    return this.cases.listIntake(actor, query);
  }

  @Get()
  @ApiOperation({ summary: 'List and search authorized cases' })
  @ApiOkResponse({ type: CaseListResponse })
  listCases(
    @Actor() actor: CurrentActor,
    @Query() query: CaseListQueryDto,
  ): Promise<CaseListResponse> {
    return this.cases.listCases(actor, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get authorized case detail by UUID' })
  @ApiOkResponse({ type: CaseDetailResponse })
  @ApiNotFoundResponse({ description: 'Case not found or outside scope.' })
  getCaseDetail(
    @Actor() actor: CurrentActor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CaseDetailResponse> {
    return this.cases.getCaseDetail(actor, id);
  }

  @Post(':id/assignments')
  @HttpCode(201)
  @ApiOperation({ summary: 'Record initial assignment for a case scope' })
  @ApiCreatedResponse({ type: AssignInitialResponse })
  @ApiConflictResponse({ description: 'Scope already has a current holder.' })
  assignInitial(
    @Actor() actor: CurrentActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AssignInitialDto,
  ): Promise<AssignInitialResponse> {
    return this.assignments.assignInitial(actor, id, body);
  }

  @Post(':id/reassignment-requests')
  @HttpCode(201)
  @ApiOperation({ summary: 'Request reassignment as active scope holder' })
  @ApiCreatedResponse({ type: ReassignmentRequestItem })
  @ApiConflictResponse({
    description: 'Missing current holder or open request already exists.',
  })
  requestReassignment(
    @Actor() actor: CurrentActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RequestReassignmentDto,
  ): Promise<ReassignmentRequestItem> {
    return this.assignments.requestReassignment(actor, id, body);
  }
}
