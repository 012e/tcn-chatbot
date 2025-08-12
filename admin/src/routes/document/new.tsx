// src/routes/document/new.tsx
import { createFileRoute } from "@tanstack/react-router";
import { DocumentForm } from "@/components/document-form";
import { createDocument } from "@/lib/api";

export const Route = createFileRoute("/document/new")({
  component: NewDocumentComponent,
});

function NewDocumentComponent() {
  return <DocumentForm onSave={createDocument} />;
}
