import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { parseCorsOrigins } from '../../config/cors';
import type { EnvironmentVariables } from '../../config/env.validation';
import { requestToken } from '../../modules/auth/session.cookie';
import { SessionService } from '../../modules/auth/session.service';
import { REQUIRES_CSRF } from './csrf.decorator';
import type { RequestWithActor } from './current-actor';
import { IS_PUBLIC } from './public.decorator';

/**
 * Authentication is global; resource authorization remains in AccessPolicy.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    delete request.actor;
    if (!isPublic) {
      const actor = await this.sessions.current(requestToken(request));
      if (!actor) throw new UnauthorizedException();
      request.actor = actor;
    }
    const requiresCsrf =
      !isPublic ||
      this.reflector.getAllAndOverride<boolean>(REQUIRES_CSRF, [
        context.getHandler(),
        context.getClass(),
      ]);
    if (requiresCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origins = parseCorsOrigins(
        this.config.get('CORS_ORIGINS', { infer: true }),
      );
      if (
        !request.headers.origin ||
        !origins.includes(request.headers.origin) ||
        request.headers['x-trasu-csrf'] !== '1'
      )
        throw new ForbiddenException();
    }
    return true;
  }
}
