import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { scoreReadiness } from "./scoring.js";
import { loadSession, listSessions, saveSession } from "./session-store.js";
import { SCORE_DIMENSIONS, type DimensionScores } from "./types.js";

const dimensionsShape = Object.fromEntries(
  SCORE_DIMENSIONS.map((dimension) => [
    dimension,
    z.number().min(0).max(10).describe(`0-10, higher = more build-ready`),
  ]),
) as Record<(typeof SCORE_DIMENSIONS)[number], z.ZodNumber>;

const dimensionsSchema = z
  .object(dimensionsShape)
  .describe("All ten Build Readiness dimensions, 0-10 each (see PROJECT_SPEC.md §10).");

const rationaleSchema = z
  .object(Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d, z.string().optional()])))
  .partial()
  .optional()
  .describe("Optional one-line justification per dimension, for explainability only.");

function toDimensionScores(dimensions: z.infer<typeof dimensionsSchema>): DimensionScores {
  return dimensions as DimensionScores;
}

const server = new McpServer({ name: "founder-mode-mcp-server", version: "0.1.0" });

server.registerTool(
  "score_readiness",
  {
    description:
      "Compute the deterministic Build Readiness Score (10 dimensions + overall + Go/Pivot/Pause band) for an idea. Pure and reproducible: identical input always yields identical output.",
    inputSchema: { dimensions: dimensionsSchema, rationale: rationaleSchema },
  },
  async ({ dimensions, rationale }) => {
    const result = scoreReadiness({ dimensions: toDimensionScores(dimensions), rationale });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
);

server.registerTool(
  "save_session",
  {
    description:
      "Score an idea and persist the run under its slug, appending to that idea's history for later comparison (re-running on the same slug shows a delta against the prior run).",
    inputSchema: {
      ideaSlug: z.string().min(1).describe("Stable, kebab-case identifier for this idea"),
      ideaSummary: z.string().min(1).describe("One-line human-readable summary of the idea"),
      dimensions: dimensionsSchema,
      rationale: rationaleSchema,
    },
  },
  async ({ ideaSlug, ideaSummary, dimensions, rationale }) => {
    const scores = toDimensionScores(dimensions);
    const result = scoreReadiness({ dimensions: scores, rationale });
    const record = await saveSession(ideaSlug, ideaSummary, { dimensions: scores, rationale }, result);
    return { content: [{ type: "text", text: JSON.stringify(record, null, 2) }] };
  },
);

server.registerTool(
  "load_session",
  {
    description: "Load the saved Build Readiness Score history for an idea slug, if any exists.",
    inputSchema: { ideaSlug: z.string().min(1) },
  },
  async ({ ideaSlug }) => {
    const record = await loadSession(ideaSlug);
    return { content: [{ type: "text", text: JSON.stringify(record, null, 2) }] };
  },
);

server.registerTool(
  "list_sessions",
  {
    description: "List every idea that has been scored, with its latest score, band, and run count.",
    inputSchema: {},
  },
  async () => {
    const summaries = await listSessions();
    return { content: [{ type: "text", text: JSON.stringify(summaries, null, 2) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
