export interface AuditLogEntry {
  id: string;
  type: "access_denied" | "permission_check";
  timestamp: string;
  actorRole: string;
  resource: string;
  action: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = "carejourney_audit_logs";
const MEMORY_KEY = "__carejourney_audit_logs__";

function readLogs(): AuditLogEntry[] {
  if (typeof window !== "undefined" && window.localStorage) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
  }

  const runtime = globalThis as typeof globalThis & { [MEMORY_KEY]?: AuditLogEntry[] };
  return runtime[MEMORY_KEY] ?? [];
}

function writeLogs(logs: AuditLogEntry[]) {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return;
  }

  const runtime = globalThis as typeof globalThis & { [MEMORY_KEY]?: AuditLogEntry[] };
  runtime[MEMORY_KEY] = logs;
}

export function appendAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  const logs = readLogs();
  logs.push(log);
  writeLogs(logs);

  return log;
}

export function getAuditLogs(): AuditLogEntry[] {
  return readLogs();
}
