import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AccessPolicy, type AccessRequest } from './access-policy';

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const maintenanceActions = [
  'operations:open',
  'operations:verify',
  'operations:close',
  'operations:read',
];

@Injectable()
export class ResourceAccessPolicy extends AccessPolicy {
  constructor(
    private readonly db: DataSource,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async isAllowed({
    actor,
    action,
    resource,
  }: AccessRequest): Promise<boolean> {
    const id = resource.id;
    if (!id || !uuid.test(id) || !uuid.test(actor.id)) return false;
    if (action === 'case:read' && resource.type === 'case') {
      const [match]: { allowed: boolean }[] = await this.db.query(
        `SELECT EXISTS (
           SELECT 1 FROM responsibility r JOIN participant_role pr
             ON pr.participant_id = r.holder_id AND pr.role_code = r.scope
           JOIN account a ON a.participant_id = r.holder_id AND a.disabled_at IS NULL
           WHERE r.case_id = $1 AND r.holder_id = $2 AND r.ended_at IS NULL
             AND r.started_at <= clock_timestamp()
         ) AS allowed`,
        [id, actor.id],
      );
      return match.allowed;
    }
    if (resource.type === 'operations' && maintenanceActions.includes(action)) {
      if (
        !this.configured('OPERATIONS_OPERATOR_IDS', actor.id) ||
        !(await this.hasRole(actor.id, 'support'))
      )
        return false;
      if (action === 'operations:open') return true;
      const [schema]: { ready: boolean }[] = await this.db.query(
        `SELECT to_regclass('maintenance_intervention') IS NOT NULL AS ready`,
      );
      if (!schema.ready) return false;
      const [match]: { allowed: boolean }[] = await this.db.query(
        `SELECT EXISTS (SELECT 1 FROM maintenance_intervention
         WHERE id = $1 AND opened_by = $2) AS allowed`,
        [id, actor.id],
      );
      return match.allowed;
    }
    if (action === 'audit:read' && resource.type === 'audit_event') {
      if (
        !this.configured('AUDIT_READER_IDS', actor.id) ||
        !(await this.hasRole(actor.id, 'auditor'))
      )
        return false;
      const [match]: { allowed: boolean }[] = await this.db.query(
        'SELECT EXISTS (SELECT 1 FROM audit_event WHERE id = $1) AS allowed',
        [id],
      );
      return match.allowed;
    }
    return false;
  }

  private configured(key: string, actorId: string): boolean {
    return (this.config.get<string>(key) ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .includes(actorId.toLowerCase());
  }

  private async hasRole(id: string, role: string): Promise<boolean> {
    const [match]: { allowed: boolean }[] = await this.db.query(
      `SELECT EXISTS (
         SELECT 1 FROM account a JOIN participant_role pr ON pr.participant_id = a.participant_id
         WHERE a.participant_id = $1 AND a.disabled_at IS NULL AND pr.role_code = $2
       ) AS allowed`,
      [id, role],
    );
    return match.allowed;
  }
}
