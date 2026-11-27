import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { CurrentActor } from '../../common/security/current-actor';
import { AuditService, type AuditEventInput } from '../audit/audit.service';
import { Account } from './session.entity';
import { verifyPassword } from './password';

export const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const tokenShape = /^[A-Za-z0-9_-]{43}$/;

function digest(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly db: DataSource,
    private readonly modules: ModuleRef,
  ) {}

  async login(login: string, password: string): Promise<string> {
    const loginKey = login.trim().toLowerCase();
    const audit = this.modules.get(AuditService, { strict: false });
    const event: AuditEventInput = {
      action: 'auth:login',
      resourceType: 'account',
      emitterCode: 'server_ingress',
      occurredAt: new Date(),
      correlationId: randomUUID(),
      kind: 'success',
      resultCode: 'success',
    };
    try {
      if (Buffer.byteLength(password) > 512) throw new UnauthorizedException();
      const account = await this.db.manager
        .createQueryBuilder(Account, 'account')
        .addSelect('account.passwordHash')
        .where('account.loginKey = :loginKey', { loginKey })
        .andWhere('account.disabledAt IS NULL')
        .getOne();
      if (
        !(await verifyPassword(password, account?.passwordHash)) ||
        !account
      ) {
        throw new UnauthorizedException();
      }
      const token = randomBytes(32).toString('base64url');
      await this.db.transaction(async (tx) => {
        const current = await tx
          .createQueryBuilder(Account, 'account')
          .addSelect('account.passwordHash')
          .where('account.id = :id', { id: account.id })
          .setLock('pessimistic_write')
          .getOne();
        if (
          !current ||
          current.disabledAt ||
          current.passwordHash !== account.passwordHash
        ) {
          throw new UnauthorizedException();
        }
        await tx.query(
          `WITH issued AS (SELECT clock_timestamp() AS at)
           INSERT INTO auth_session(account_id, token_digest, issued_at, expires_at)
           SELECT $1, $2, at, at + $3 * interval '1 millisecond' FROM issued`,
          [account.id, digest(token), sessionLifetimeMs],
        );
        await audit.recordEvent(tx, {
          ...event,
          actorId: current.participantId,
          resourceId: current.id,
        });
      });
      return token;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        try {
          await audit.recordUnsuccessful({
            ...event,
            kind: 'denied',
            resultCode: 'denied',
          });
        } catch {
          this.logger.warn('Could not persist a login denial audit event.');
        }
      }
      throw error;
    }
  }

  async current(token: string | undefined): Promise<CurrentActor | null> {
    if (!token || !tokenShape.test(token)) return null;
    const [actor]: CurrentActor[] = await this.db.query(
      `SELECT a.participant_id AS id, ARRAY(
         SELECT pr.role_code FROM participant_role pr
         WHERE pr.participant_id = a.participant_id ORDER BY pr.role_code
       ) AS roles
       FROM auth_session s JOIN account a ON a.id = s.account_id
       WHERE s.token_digest = $1 AND s.revoked_at IS NULL
         AND s.expires_at > clock_timestamp() AND a.disabled_at IS NULL`,
      [digest(token)],
    );
    return actor ?? null;
  }

  async revoke(token: string): Promise<void> {
    if (!tokenShape.test(token)) throw new UnauthorizedException();
    const audit = this.modules.get(AuditService, { strict: false });
    await this.db.transaction(async (tx) => {
      const [account]: { id: string; participantId: string }[] = await tx.query(
        `WITH revoked AS (
           UPDATE auth_session SET revoked_at = GREATEST(clock_timestamp(), issued_at)
           WHERE token_digest = $1 AND revoked_at IS NULL AND expires_at > clock_timestamp()
           RETURNING account_id
         )
         SELECT a.id, a.participant_id AS "participantId"
         FROM revoked JOIN account a ON a.id = revoked.account_id`,
        [digest(token)],
      );
      if (!account) throw new UnauthorizedException();
      await audit.recordEvent(tx, {
        action: 'auth:logout',
        resourceType: 'account',
        emitterCode: 'server_ingress',
        occurredAt: new Date(),
        correlationId: randomUUID(),
        actorId: account.participantId,
        resourceId: account.id,
        kind: 'success',
        resultCode: 'success',
      });
    });
  }
}
