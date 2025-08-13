import axios from "axios";
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

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function listDocuments(params?: {
  page?: number;
  pageSize?: number;
}) {
  const { data } = await axiosInstance.get<PageResult<Document>>("/document", {
    params,
  });
  return data;
}

export async function deleteDocument(id: number) {
  await axiosInstance.delete(`/document/${id}`);
}

export async function getDocumentById(id: string): Promise<Document> {
  const { data } = await axiosInstance.get<Document>(`/document/${id}`);
  return data;
}

export async function updateDocument({
  documentId,
  content,
}: {
  documentId: string;
  content: string;
}) {
  await axiosInstance.put(`/document/${documentId}`, { content });
}

export async function createDocument(input: { content: string }) {
  await axiosInstance.post("/document", input);
}
