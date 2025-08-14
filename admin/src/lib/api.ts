import { loginCredentialAtom } from "@/store/login-credential";
import axios from "axios";
import { createStore, getDefaultStore } from "jotai";
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

const store = getDefaultStore();

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const basicAuth = store.get(loginCredentialAtom);
  if (basicAuth && basicAuth.username && basicAuth.password) {
    config.auth = {
      username: basicAuth.username,
      password: basicAuth.password,
    };
  }
  return config;
});

export async function listDocuments(params?: {
  page?: number;
  pageSize?: number;
}) {
  const { data } = await axiosInstance.get<PageResult<Document>>(
    "/internal/document",
    {
      params,
    },
  );
  return data;
}

export async function deleteDocument(id: number) {
  await axiosInstance.delete(`/document/${id}`);
}

export async function getDocumentById(id: string): Promise<Document> {
  const { data } = await axiosInstance.get<Document>(
    `/internal/document/${id}`,
  );
  return data;
}

export async function updateDocument({
  documentId,
  content,
}: {
  documentId: string;
  content: string;
}) {
  await axiosInstance.put(`/internal/document/${documentId}`, { content });
}

export async function createDocument(input: { content: string }) {
  await axiosInstance.post("/internal/document", input);
}
