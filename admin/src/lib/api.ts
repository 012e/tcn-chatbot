export type Document = {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

const API_BASE =
  import.meta.env.VITE_BACKEND_ENDPOINT || "http://localhost:8787/api";

export async function listDocuments(params?: {
  page?: number;
  pageSize?: number;
}) {
  const url = new URL(`${API_BASE}/document`);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.pageSize)
    url.searchParams.set("pageSize", String(params.pageSize));

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.status}`);
  }
  const data = (await res.json()) as PageResult<Document>;
  return data;
}

export async function deleteDocument(id: number) {
  const res = await fetch(`${API_BASE}/document/${id}`, { method: "DELETE" });
  if (res.status === 204) return;
  if (res.status === 404) throw new Error("Document not found");
  if (!res.ok) throw new Error(`Failed to delete document: ${res.status}`);
}

// Create a new document
export async function createDocument(input: { content: string }) {
  const res = await fetch(`${API_BASE}/document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (res.status === 201) return;
  const data = await res.json().catch(() => ({}));
  const msg =
    (data && (data.message || data.error)) ||
    `Failed to create document: ${res.status}`;
  throw new Error(msg);
}
