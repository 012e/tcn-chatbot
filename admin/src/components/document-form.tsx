import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import Editor from "./editor";
import { Document } from "@/lib/api";

interface DocumentFormProps {
  initialContent?: string;
  onSave: (data: Document) => Promise<unknown>;
  isUpdate?: boolean;
}

export function DocumentForm({
  initialContent = "",
  onSave,
  isUpdate = false,
}: DocumentFormProps) {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const documentId = isUpdate
    ? (params as { documentId: string }).documentId
    : undefined;
  const [content, setContent] = useState(initialContent);

  const contentMutation = useMutation({
    mutationFn: onSave,
    onError: (error: Error) => {
      toast.error(`Thao tác thất bại: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Thao tác thành công!");
      navigate({ to: "/document", replace: true });
    },
  });

  const handleSave = useCallback(() => {
    if (isUpdate && documentId) {
      contentMutation.mutate({ documentId, content });
    } else {
      contentMutation.mutate({ content });
    }
  }, [content, contentMutation, isUpdate, documentId]);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const isSubmitting = contentMutation.isPending;

  return (
    <div className="container p-4 mx-auto max-w-5xl md:py-8">
      <div className="flex flex-col h-full">
        <div className="flex gap-4 justify-between items-center mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/document" })}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Quay lại
          </Button>
          <div className="flex gap-2 items-center">
            <Button
              disabled={isSubmitting || !content.trim()}
              onClick={handleSave}
              className="h-9"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              ) : (
                <Save className="mr-2 w-4 h-4" />
              )}
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </div>
        <div className="flex overflow-hidden flex-col flex-grow rounded-lg border shadow-sm bg-background">
          <Editor content={content} setContent={setContent} />
        </div>
      </div>
    </div>
  );
}
