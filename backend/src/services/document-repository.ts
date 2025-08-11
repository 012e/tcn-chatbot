import type { CursorPage } from "@/helpers/types";

export type DocumentCreateDto = {
  content: string;
  createdAt: string;
  updatedAt: string;
  docmentChunks: DocumentChunkCreateDto[];
};

export type DocumentChunkCreateDto = {
  chunk: string;
  metadata?: string;
  embedding: number[];
};

export type Document = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  documentChunks: DocumentChunkCreateDto[];
};

export type DocumentChunk = {
  id: string;
  chunk: string;
  metadata?: string;
  documentId: string;
};

// A lightweight representation for listing documents
export type DocumentListItem = {
  id: number;
  content: string;
  createdAt: string; // ISO string for API responses
  updatedAt: string; // ISO string for API responses
};

export interface DocumentRepository {
  saveDocument(document: DocumentCreateDto): Promise<void>;
  getReleventChunks(
    documentVector: number[],
    topK: number,
  ): Promise<DocumentChunk[]>;
  deleteDocument(id: number): Promise<boolean>;
  listDocuments(params: {
    limit: number;
    cursor?: string | null;
  }): Promise<CursorPage<DocumentListItem>>;
}
