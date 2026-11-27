import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import type { Request, Response } from 'express';
import { Actor, type CurrentActor } from '../../common/security/current-actor';
import { RequireCsrf } from '../../common/security/csrf.decorator';
import { Public } from '../../common/security/public.decorator';
import type { EnvironmentVariables } from '../../config/env.validation';
import { requestToken, sessionCookie } from './session.cookie';
import { SessionService, sessionLifetimeMs } from './session.service';

class LoginInput {
  @IsString()
  @Length(1, 128)
  login: string;

  @IsString()
  @Length(1, 512)
  password: string;
}

@ApiTags('Local session')
@Controller('auth')
export class SessionController {
  constructor(
    private readonly sessions: SessionService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @RequireCsrf()
  @Post('login')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async login(
    @Body() input: LoginInput,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = await this.sessions.login(input.login, input.password);
    response.cookie(sessionCookie, token, {
      ...this.cookieOptions(request),
      maxAge: sessionLifetimeMs,
    });
  }

  @Get('session')
  @Header('Cache-Control', 'no-store')
  current(@Actor() actor: CurrentActor): CurrentActor {
    return actor;
  }

  @Post('logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = requestToken(request);
    if (!token) throw new UnauthorizedException();
    await this.sessions.revoke(token);
    response.clearCookie(sessionCookie, this.cookieOptions(request));
  }

  private cookieOptions(request: Request) {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure:
        request.secure ||
        this.config.get('NODE_ENV', { infer: true }) === 'production',
    };
  }
}
