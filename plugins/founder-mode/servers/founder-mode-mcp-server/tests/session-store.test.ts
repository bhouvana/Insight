import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scoreReadiness } from "../src/scoring.js";
import { loadSession, listSessions, saveSession } from "../src/session-store.js";
import { SCORE_DIMENSIONS, type DimensionScores, type ScoreInput } from "../src/types.js";

function uniformInput(value: number): ScoreInput {
  const dimensions = Object.fromEntries(
    SCORE_DIMENSIONS.map((dimension) => [dimension, value]),
  ) as DimensionScores;
  return { dimensions };
}

let tempDataDir: string;
let originalPluginData: string | undefined;

beforeEach(async () => {
  originalPluginData = process.env.CLAUDE_PLUGIN_DATA;
  tempDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "founder-mode-test-"));
  process.env.CLAUDE_PLUGIN_DATA = tempDataDir;
});

afterEach(async () => {
  if (originalPluginData === undefined) {
    delete process.env.CLAUDE_PLUGIN_DATA;
  } else {
    process.env.CLAUDE_PLUGIN_DATA = originalPluginData;
  }
  await fs.rm(tempDataDir, { recursive: true, force: true });
});

describe("saveSession / loadSession round-trip", () => {
  it("returns null for a slug that was never saved", async () => {
    expect(await loadSession("never-existed")).toBeNull();
  });

  it("saves and loads back matching data", async () => {
    const input = uniformInput(6);
    const result = scoreReadiness(input);
    await saveSession("habit-tracker", "A habit-tracking app with streaks", input, result);

    const loaded = await loadSession("habit-tracker");
    expect(loaded).not.toBeNull();
    expect(loaded!.ideaSlug).toBe("habit-tracker");
    expect(loaded!.ideaSummary).toBe("A habit-tracking app with streaks");
    expect(loaded!.history).toHaveLength(1);
    expect(loaded!.history[0]!.result.overall).toBe(result.overall);
  });

  it("accumulates history across repeated saves to the same slug (delta tracking)", async () => {
    const first = uniformInput(4);
    const second = uniformInput(8);
    await saveSession("fintech-tool", "B2B reconciliation SaaS", first, scoreReadiness(first));
    await saveSession("fintech-tool", "B2B reconciliation SaaS, now with an ICP", second, scoreReadiness(second));

    const loaded = await loadSession("fintech-tool");
    expect(loaded!.history).toHaveLength(2);
    expect(loaded!.history[0]!.result.overall).toBe(40);
    expect(loaded!.history[1]!.result.overall).toBe(80);
    expect(loaded!.createdAt).toBe(loaded!.history[0]!.timestamp);
    expect(new Date(loaded!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(loaded!.createdAt).getTime());
  });

  it("degrades gracefully (returns null, does not throw) on a corrupt session file", async () => {
    const sessionsDir = path.join(tempDataDir, "sessions");
    await fs.mkdir(sessionsDir, { recursive: true });
    await fs.writeFile(path.join(sessionsDir, "broken.json"), "{ not valid json", "utf-8");

    await expect(loadSession("broken")).resolves.toBeNull();
  });
});

describe("listSessions", () => {
  it("returns an empty array when no sessions directory exists yet", async () => {
    expect(await listSessions()).toEqual([]);
  });

  it("summarizes multiple ideas with latest score and run count", async () => {
    const a = uniformInput(9);
    const b1 = uniformInput(3);
    const b2 = uniformInput(6);
    await saveSession("idea-a", "Idea A", a, scoreReadiness(a));
    await saveSession("idea-b", "Idea B", b1, scoreReadiness(b1));
    await saveSession("idea-b", "Idea B", b2, scoreReadiness(b2));

    const summaries = await listSessions();
    expect(summaries).toHaveLength(2);

    const ideaB = summaries.find((s) => s.ideaSlug === "idea-b")!;
    expect(ideaB.runCount).toBe(2);
    expect(ideaB.latestOverall).toBe(60);

    const ideaA = summaries.find((s) => s.ideaSlug === "idea-a")!;
    expect(ideaA.runCount).toBe(1);
    expect(ideaA.latestOverall).toBe(90);
  });

  it("skips a corrupt session file rather than failing the whole listing", async () => {
    const good = uniformInput(7);
    await saveSession("good-idea", "A fine idea", good, scoreReadiness(good));

    const sessionsDir = path.join(tempDataDir, "sessions");
    await fs.writeFile(path.join(sessionsDir, "broken.json"), "not json at all", "utf-8");

    const summaries = await listSessions();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]!.ideaSlug).toBe("good-idea");
  });
});
