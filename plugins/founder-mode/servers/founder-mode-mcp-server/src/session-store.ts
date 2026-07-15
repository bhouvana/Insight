import { promises as fs } from "node:fs";
import path from "node:path";
import type { ScoreInput, ScoreResult, SessionRecord, SessionSummary } from "./types.js";

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}

function sessionsDir(): string {
  const dataDir = process.env.CLAUDE_PLUGIN_DATA;
  if (!dataDir) {
    throw new Error(
      "CLAUDE_PLUGIN_DATA is not set; session persistence requires the plugin data directory.",
    );
  }
  return path.join(dataDir, "sessions");
}

function sessionPath(ideaSlug: string): string {
  return path.join(sessionsDir(), `${ideaSlug}.json`);
}

export async function saveSession(
  ideaSlug: string,
  ideaSummary: string,
  input: ScoreInput,
  result: ScoreResult,
): Promise<SessionRecord> {
  const dir = sessionsDir();
  await fs.mkdir(dir, { recursive: true });

  const now = new Date().toISOString();
  const existing = await loadSession(ideaSlug);
  const entry = { timestamp: now, input, result };

  const record: SessionRecord = existing
    ? { ...existing, ideaSummary, updatedAt: now, history: [...existing.history, entry] }
    : { ideaSlug, ideaSummary, createdAt: now, updatedAt: now, history: [entry] };

  await fs.writeFile(sessionPath(ideaSlug), JSON.stringify(record, null, 2), "utf-8");
  return record;
}

/**
 * A missing file is the normal "no prior session" case (returns null).
 * A corrupt/unreadable file also returns null rather than throwing — a
 * broken history file must not block evaluating a new idea (see
 * ENGINEERING_PRINCIPLES.md §4) — but it's logged so the failure isn't
 * silent.
 */
export async function loadSession(ideaSlug: string): Promise<SessionRecord | null> {
  let raw: string;
  try {
    raw = await fs.readFile(sessionPath(ideaSlug), "utf-8");
  } catch (err) {
    if (isNodeError(err) && err.code === "ENOENT") return null;
    console.error(`[founder-mode-mcp-server] Failed to read session "${ideaSlug}":`, err);
    return null;
  }

  try {
    return JSON.parse(raw) as SessionRecord;
  } catch (err) {
    console.error(`[founder-mode-mcp-server] Corrupt session file for "${ideaSlug}":`, err);
    return null;
  }
}

export async function listSessions(): Promise<SessionSummary[]> {
  const dir = sessionsDir();
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    if (isNodeError(err) && err.code === "ENOENT") return [];
    throw err;
  }

  const summaries: SessionSummary[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const slug = file.slice(0, -".json".length);
    const record = await loadSession(slug);
    if (!record || record.history.length === 0) continue;
    const latest = record.history[record.history.length - 1]!;
    summaries.push({
      ideaSlug: record.ideaSlug,
      ideaSummary: record.ideaSummary,
      latestOverall: latest.result.overall,
      latestBand: latest.result.band,
      updatedAt: record.updatedAt,
      runCount: record.history.length,
    });
  }
  return summaries;
}
