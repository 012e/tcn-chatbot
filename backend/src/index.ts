import { Hono } from "hono";
import { InsertDocumentSchema, RagService } from "./services/rag-service";
import { logger } from "hono/logger";
import z from "zod";
import { TursoDocumentRepository } from "./services/turso-document-repository";
import { db } from "./db";
import { RecursiveChunker } from "./services/recursive-chunker";
import dotenv from "dotenv";
import { ChatBot } from "./services/openai-chatbot";
import { cors } from "hono/cors";
import { getConfig } from "./config";
import type { CursorQuery } from "@/helpers/types";
dotenv.config({ path: ".env.local" });

const app = new Hono().use(logger()).use(cors()).basePath("/api");

const createRagService = () => {
  const documentRepository = new TursoDocumentRepository(db);
  const chunker = new RecursiveChunker();
  return new RagService(documentRepository, chunker);
};

app.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    if (!body["messages"] || !Array.isArray(body["messages"])) {
      return c.json(
        {
          message: "messages must be an array",
        },
        400,
      );
    }
    const chatbot = new ChatBot(getConfig(), createRagService());
    return await chatbot.chat(body["messages"]);
  } catch (e) {
    console.error("Error processing chat request:", e);
    return c.json(
      {
        message: "invalid json",
      },
      400,
    );
  }
});

app.get("/health", (c) => {
  return c.text("Hello, Hono!");
});

app.get("/search/document", async (c) => {
  const query = c.req.query("q");
  if (!query) {
    return c.json(
      {
        message: "query parameter 'q' is required",
      },
      400,
    );
  }
  const ragService = createRagService();
  const results = await ragService.getRelevantChunks(query);
  return c.json(results);
});

app.post("/document", async (c) => {
  let jsonBody = null;
  try {
    jsonBody = await c.req.json();
  } catch (e) {
    return c.json({
      message: "invalid json",
    });
  }

  const insertDocumentCommand = InsertDocumentSchema.safeParse(jsonBody);
  if (!insertDocumentCommand.success) {
    return c.json(
      { message: z.prettifyError(insertDocumentCommand.error) },
      400,
    );
  }

  const ragService = createRagService();
  await ragService.insertDocument({
    content: insertDocumentCommand.data.content,
  });

  return c.json(
    {
      message: "success",
    },
    201,
  );
});

// List documents with cursor pagination
app.get("/document", async (c) => {
  const { cursor, limit }: CursorQuery = {
    cursor: c.req.query("cursor") ?? null,
    limit: c.req.query("limit") ?? null,
  };

  const repo = new TursoDocumentRepository(db);
  const page = await repo.listDocuments({
    cursor,
    limit: limit == null ? 20 : Number(limit),
  });

  return c.json(page);
});

// Delete a single document by id
app.delete("/document/:id", async (c) => {
  const idParam = c.req.param("id");
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: "invalid document id" }, 400);
  }

  try {
    const repo = new TursoDocumentRepository(db);
    const deleted = await repo.deleteDocument(id);
    if (!deleted) {
      return c.json({ message: "document not found" }, 404);
    }
    return c.body(null, 204);
  } catch (e) {
    console.error("Error deleting document:", e);
    return c.json({ message: "internal server error" }, 500);
  }
});

export default app;
