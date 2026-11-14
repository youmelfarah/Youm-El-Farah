import { Prisma } from "@prisma/client";

export interface LogAuditEntryParams {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  providerId?: string | null;
  details?: Prisma.InputJsonValue;
}

/**
 * Creates an audit log entry within a Prisma transaction client.
 */
export async function logAuditEntry(
  tx: Prisma.TransactionClient,
  params: LogAuditEntryParams
) {
  return tx.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      providerId: params.providerId ?? null,
      details: params.details ?? Prisma.DbNull,
    },
  });
}
