import { Client, LibsqlError } from "@libsql/client";
import {
  DocumentChunk,
  DocumentCreateDto,
  DocumentRepository,
  DocumentListItem,
} from "./document-repository";
import type { CursorPage } from "@/helpers/types";

export class TursoDocumentRepository implements DocumentRepository {
  public constructor(private readonly _db: Client) {}

  async saveDocument(document: DocumentCreateDto): Promise<void> {
    const transaction = await this._db.transaction("write");
    try {
      const documentResult = await transaction.execute({
        sql: "INSERT INTO documents (content, created_at, updated_at) VALUES (?, ?, ?) RETURNING id",
        args: [document.content, document.createdAt, document.updatedAt],
      });
      const documentId = (documentResult.rows[0] as any).id as number;

      for (const documentChunk of document.docmentChunks) {
        await transaction.execute({
          sql: "INSERT INTO document_chunks (document_id, chunk, metadata, embedding) VALUES (?, ?, ?, vector32(?))",
          args: [
            documentId,
            documentChunk.chunk,
            documentChunk.metadata ?? null,
            JSON.stringify(documentChunk.embedding),
          ],
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error("Error saving document:", error);
      throw error;
    }
  }

  async getReleventChunks(
    documentVector: number[],
    topK: number,
  ): Promise<DocumentChunk[]> {
    try {
      const result = await this._db.execute({
        sql: `
          SELECT id, chunk, metadata, document_id, embedding
          FROM document_chunks
          ORDER BY vector_distance_cos(embedding, vector32(?))
          LIMIT ?
        `,
        args: [JSON.stringify(documentVector), topK],
      });

      return result.rows.map((row) => this.mapRowToDocumentChunk(row));
    } catch (error) {
      if (error instanceof LibsqlError) {
        console.error(
          "Database error fetching relevant chunks:",
          error.message,
        );
      } else {
        console.error("An unexpected error occurred:", error);
      }
      throw error;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Invalid document id");
    }

    const transaction = await this._db.transaction("write");
    try {
      // First check if it exists
      const existing = await transaction.execute({
        sql: `SELECT id FROM documents WHERE id = ?`,
        args: [id],
      });

      if (existing.rows.length === 0) {
        await transaction.rollback();
        return false; // not found
      }

      // Delete the document (chunks are deleted via ON DELETE CASCADE)
      await transaction.execute({
        sql: `DELETE FROM documents WHERE id = ?`,
        args: [id],
      });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof LibsqlError) {
        console.error("Database error deleting document:", error.message);
      } else {
        console.error("An unexpected error occurred while deleting:", error);
      }
      throw error;
    }
  }

  async listDocuments(params: {
    limit: number;
    cursor?: string | null;
  }): Promise<CursorPage<DocumentListItem>> {
    const { limit, cursor } = params;
    const parsedLimit = Number(limit);
    const pageSize = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(100, parsedLimit))
      : 20;

    // Use numeric string cursor (last seen id). If invalid or missing, start from max (no WHERE)
    let lastId = 0;
    if (cursor != null && cursor !== "") {
      const parsed = Number(cursor);
      if (Number.isFinite(parsed) && parsed >= 0) lastId = parsed;
    }

    // We page by descending id (newest first). If a cursor is provided, fetch items with id < lastId
    const args: any[] = [];
    let sql = `
      SELECT id, content, created_at, updated_at
      FROM documents
    `;
    if (lastId > 0) {
      sql += ` WHERE id < ?`;
      args.push(lastId);
    }
    sql += ` ORDER BY id DESC LIMIT ?`;
    args.push(pageSize + 1); // fetch one extra to compute nextCursor

    const result = await this._db.execute({ sql, args });

    const rows = result.rows as any[];
    const hasMore = rows.length > pageSize;
    const itemsSlice = hasMore ? rows.slice(0, pageSize) : rows;

    const items: DocumentListItem[] = itemsSlice.map((r) => ({
      id: Number(r.id),
      content: String(r.content),
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    }));

    let nextCursor: string | null | undefined = null;
    if (hasMore) {
      const last = itemsSlice[itemsSlice.length - 1];
      nextCursor = String(last.id);
    }

    return { items, nextCursor };
  }

  private mapRowToDocumentChunk(row: any): DocumentChunk {
    return {
      id: String(row.id),
      chunk: row.chunk as string,
      metadata: row.metadata as string | undefined,
      documentId: String(row.document_id),
    };
  }
}
