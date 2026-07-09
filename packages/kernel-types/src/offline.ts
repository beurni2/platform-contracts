/**
 * Offline-queue status semantics (spec §5.1, all apps):
 * "queued = pending, never done" — an offline-queued action is NEVER a final
 * state, and custody/delivery/financial release remain pending until
 * authoritative server acknowledgement (SE-I06).
 */
export type OfflineQueueStatus =
  | 'queued'
  | 'syncing'
  | 'server_acknowledged'
  | 'rejected';

/**
 * The only statuses that may ever be rendered or treated as final.
 * 'queued' and 'syncing' are pending by definition.
 */
export type FinalOfflineQueueStatus = Extract<
  OfflineQueueStatus,
  'server_acknowledged' | 'rejected'
>;

export const PENDING_OFFLINE_STATUSES = ['queued', 'syncing'] as const satisfies readonly OfflineQueueStatus[];
export const FINAL_OFFLINE_STATUSES = ['server_acknowledged', 'rejected'] as const satisfies readonly FinalOfflineQueueStatus[];

export function isFinalOfflineStatus(status: OfflineQueueStatus): status is FinalOfflineQueueStatus {
  return status === 'server_acknowledged' || status === 'rejected';
}
