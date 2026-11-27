import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Persona autenticada que ejecuta una operación. Contrato inicial (BE-002),
 * pendiente de acordar con I3, I4 e I5. Los nombres de rol los fija BE-007a.
 */
export interface CurrentActor {
  readonly id: string;
  readonly roles: readonly string[];
}

/** `actor` solo lo escribe la autenticación del servidor (BE-007a). */
export type RequestWithActor = Request & { actor?: CurrentActor };

export const Actor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentActor => {
    const { actor } = context.switchToHttp().getRequest<RequestWithActor>();
    if (!actor) throw new UnauthorizedException();
    return actor;
  },
);
