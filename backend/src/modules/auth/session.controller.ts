import {
  Body,
  Controller,
  ForbiddenException,
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
import { timingSafeEqual } from 'node:crypto';
import { TLSSocket } from 'node:tls';
import { Actor, type CurrentActor } from '../../common/security/current-actor';
import { RequireCsrf } from '../../common/security/csrf.decorator';
import { Public } from '../../common/security/public.decorator';
import type { EnvironmentVariables } from '../../config/env.validation';
import { loopbackHost, loopbackPeer } from '../../config/loopback';
import { LoginAdmission } from './login-admission';
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
    private readonly admission: LoginAdmission,
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
    const options = this.cookieOptions(request);
    const peer = request.socket.remoteAddress ?? 'unknown';
    const token = await this.admission.run(peer, () =>
      this.sessions.login(input.login, input.password),
    );
    response.cookie(sessionCookie, token, {
      ...options,
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
    const options = this.cookieOptions(request);
    const token = requestToken(request);
    if (!token) throw new UnauthorizedException();
    await this.sessions.revoke(token);
    response.clearCookie(sessionCookie, options);
  }

  private cookieOptions(request: Request) {
    const origin = request.headers.origin;
    const localPeer = loopbackPeer(request.socket.remoteAddress);
    const secret = this.config.get('AUTH_LOOPBACK_PROXY_SECRET', {
      infer: true,
    });
    const proof = request.headers['x-trasu-proxy-proof'];
    const secure =
      (request.socket instanceof TLSSocket && request.socket.encrypted) ||
      (localPeer &&
        request.headers['x-forwarded-proto'] === 'https' &&
        typeof proof === 'string' &&
        !!secret &&
        matchesProxySecret(proof, secret));
    const localHttp =
      !secure &&
      !secret &&
      this.config.get('NODE_ENV', { infer: true }) === 'development' &&
      this.config.get('AUTH_ALLOW_LOCAL_HTTP', { infer: true }) === 'true' &&
      localPeer &&
      loopbackHost(request.hostname) &&
      !!origin &&
      URL.canParse(origin) &&
      new URL(origin).protocol === 'http:' &&
      loopbackHost(new URL(origin).hostname);
    if (!secure && !localHttp) throw new ForbiddenException();
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      path: '/',
      secure,
    };
  }
}

function matchesProxySecret(proof: string, secret: string): boolean {
  if (!/^[A-Za-z0-9_-]{43}$/.test(proof)) return false;
  const presented = Buffer.from(proof);
  const configured = Buffer.from(secret);
  return (
    presented.length === configured.length &&
    timingSafeEqual(presented, configured)
  );
}
