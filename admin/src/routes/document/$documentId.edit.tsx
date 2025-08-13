import { createFileRoute } from "@tanstack/react-router";
import { DocumentForm } from "@/components/document-form";
import { updateDocument, getDocumentById } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/document/$documentId/edit")({
  ssr: "data-only",
  loader: async ({ params }) => {
    const { documentId } = params;
    if (!documentId) {
      throw new Error("Document ID is required");
    }
    const document = await getDocumentById(documentId);
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
  const doc = Route.useLoaderData();
  const { documentId } = Route.useParams();
  const handleDocumentUpdate = async ({ content }: { content: string }) => {
    if (!documentId) {
      throw new Error("Document ID is required for update");
    }
    await updateDocument({ documentId, content });
  };

  return (
    <DocumentForm
      initialContent={doc.content}
      onSave={handleDocumentUpdate}
      isUpdate={true}
    />
  );
}
