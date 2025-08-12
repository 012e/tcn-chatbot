import { createFileRoute } from "@tanstack/react-router";
import { DocumentForm } from "@/components/document-form";
import { updateDocument, fetchDocumentById } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/document/$documentId/edit")({
  ssr: "data-only",
  loader: async ({ params }) => {
    const { documentId } = params;
    if (!documentId) {
      throw new Error("Document ID is required");
    }
    const document = await fetchDocumentById(documentId);
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found`);
    }
    return document;
  },
  pendingComponent: () => (
    <div className="w-full h-full">
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin size-10" />
      </div>
    </div>
  ),

  component: EditDocumentComponent,
});

function EditDocumentComponent() {
  const document = Route.useLoaderData();

  return (
    <DocumentForm
      initialContent={document.content}
      onSave={updateDocument}
      isUpdate={true}
    />
  );
}
