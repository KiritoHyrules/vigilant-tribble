import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Actor, type CurrentActor } from '../../common/security/current-actor';
import { AssignmentsService } from './assignments.service';
import { DecideReassignmentDto } from './dto/decide-reassignment.dto';
import { ReassignmentListQueryDto } from './dto/reassignment-query.dto';
import {
  ReassignmentRequestDetailResponse,
  ReassignmentRequestListResponse,
  TreatReassignmentResponse,
} from './dto/reassignment-response.dto';
import { TreatReassignmentDto } from './dto/treat-reassignment.dto';

@ApiTags('reassignment-requests')
@ApiUnauthorizedResponse({ description: 'Authentication required.' })
@ApiForbiddenResponse({ description: 'Denied by authorization policy.' })
@Controller('reassignment-requests')
export class ReassignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List reassignment requests in actor scope' })
  @ApiOkResponse({ type: ReassignmentRequestListResponse })
  list(
    @Actor() actor: CurrentActor,
    @Query() query: ReassignmentListQueryDto,
  ): Promise<ReassignmentRequestListResponse> {
    return this.assignments.listRequests(actor, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reassignment request detail by UUID' })
  @ApiOkResponse({ type: ReassignmentRequestDetailResponse })
  @ApiNotFoundResponse({ description: 'Request not found or outside scope.' })
  getDetail(
    @Actor() actor: CurrentActor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReassignmentRequestDetailResponse> {
    return this.assignments.getRequestDetail(actor, id);
  }

  @Post(':id/decision')
  @HttpCode(200)
  @ApiOperation({ summary: 'Approve or reject a pending reassignment request' })
  @ApiOkResponse({ type: ReassignmentRequestDetailResponse })
  @ApiConflictResponse({
    description: 'Already decided, stale context, or requires treatment.',
  })
  decide(
    @Actor() actor: CurrentActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: DecideReassignmentDto,
  ): Promise<ReassignmentRequestDetailResponse> {
    return this.assignments.decideReassignment(actor, id, body);
  }

  @Post(':id/treatment')
  @HttpCode(201)
  @ApiOperation({ summary: 'Treat a stale reassignment request' })
  @ApiCreatedResponse({ type: TreatReassignmentResponse })
  @ApiConflictResponse({ description: 'Request does not require treatment.' })
  treat(
    @Actor() actor: CurrentActor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TreatReassignmentDto,
  ): Promise<TreatReassignmentResponse> {
    return this.assignments.treatReassignment(actor, id, body);
  }
}
