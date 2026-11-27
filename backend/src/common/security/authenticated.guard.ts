import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithActor } from './current-actor';
import { IS_PUBLIC } from './public.decorator';

/**
 * Todo endpoint exige actor salvo @Public(). Todavía nadie asigna el actor,
 * así que los endpoints protegidos responden 401 hasta BE-007a.
 * Autenticar no autoriza: usar además AccessPolicy sobre el recurso.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    if (context.switchToHttp().getRequest<RequestWithActor>().actor) {
      return true;
    }
    throw new UnauthorizedException();
  }
}
