import { ForbiddenException, Injectable } from '@nestjs/common';
import type { CurrentActor } from './current-actor';

/** Recurso concreto sobre el que se pide actuar. */
export interface ResourceRef {
  readonly type: string;
  readonly id?: string;
}

export interface AccessRequest {
  readonly actor: CurrentActor;
  /** Ejemplo de formato: "case:read". Cada módulo define sus acciones. */
  readonly action: string;
  readonly resource: ResourceRef;
}

/**
 * Política común de autorización. Cada operación de negocio la invoca con el
 * recurso concreto: `await policy.assertAllowed({ actor, action, resource })`.
 */
export abstract class AccessPolicy {
  abstract isAllowed(request: AccessRequest): Promise<boolean>;

  async assertAllowed(request: AccessRequest): Promise<void> {
    if ((await this.isAllowed(request)) !== true) {
      throw new ForbiddenException();
    }
  }
}

/** Provisional hasta BE-007a: falla cerrado, no concede nada. */
@Injectable()
export class DenyAllAccessPolicy extends AccessPolicy {
  isAllowed(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
