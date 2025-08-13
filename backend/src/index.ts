import { Hono } from "hono";
import { InsertDocumentSchema, RagService } from "./services/rag-service";
import { logger } from "hono/logger";
import z from "zod";
import { TursoDocumentRepository } from "./services/turso-document-repository";
import { db } from "./db";
import { RecursiveChunker } from "./services/recursive-chunker";
import { ChatBot } from "./services/openai-chatbot";
import { cors } from "hono/cors";
import { getConfig } from "./config";
import type { PageQuery } from "@/helpers/types";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

const app = new Hono()
  .use(logger())
  .use(cors())
  .use("*", clerkMiddleware())
  .basePath("/api");

const createRagService = () => {
  const documentRepository = new TursoDocumentRepository(db);
  const chunker = new RecursiveChunker();
  return new RagService(documentRepository, chunker);
};

app.post("public/chat", async (c) => {
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

app.get("/public/health", (c) => {
  return c.text("Hello, Hono!");
});

app.get("/search/document", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }

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
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }
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

app.get("/document", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }
  const { page, pageSize }: PageQuery = {
    page: c.req.query("page") ?? 1,
    pageSize: c.req.query("pageSize") ?? 20,
  };

  const repo = new TursoDocumentRepository(db);
  const result = await repo.listDocuments({
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 20,
  });

  return c.json(result);
});

app.get("/document/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }
  const idParam = c.req.param("id");
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: "invalid document id" }, 400);
  }

  try {
    const repo = new TursoDocumentRepository(db);
    const document = await repo.getDocumentById(id);

    if (!document) {
      return c.json({ message: "document not found" }, 404);
    }

    return c.json(document);
  } catch (e) {
    console.error("Error fetching document:", e);
    return c.json({ message: "internal server error" }, 500);
  }
});

app.put("/document/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }
  const idParam = c.req.param("id");
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ message: "invalid document id" }, 400);
  }

  let jsonBody = null;
  try {
    jsonBody = await c.req.json();
  } catch (e) {
    return c.json(
      {
        message: "invalid json",
      },
      400,
    );
  }

  const updateDocumentCommand = InsertDocumentSchema.safeParse(jsonBody);
  if (!updateDocumentCommand.success) {
    return c.json(
      { message: z.prettifyError(updateDocumentCommand.error) },
      400,
    );
  }

  try {
    const repo = new TursoDocumentRepository(db);

    // First check if document exists
    const existingDocument = await repo.getDocumentById(id);
    if (!existingDocument) {
      return c.json({ message: "document not found" }, 404);
    }

    // Use RAG service to update document with new chunks and embeddings
    const ragService = createRagService();
    await ragService.updateDocument(id, {
      content: updateDocumentCommand.data.content,
    });

    return c.json({
      message: "document updated successfully",
    });
  } catch (e) {
    console.error("Error updating document:", e);
    return c.json({ message: "internal server error" }, 500);
  }
});

app.delete("/document/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
      },
      401,
    );
  }
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
