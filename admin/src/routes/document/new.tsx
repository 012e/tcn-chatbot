import { Button } from "@/components/ui/button";
import { createDocument } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import Editor from "./-editor";

export const Route = createFileRoute("/document/new")({
  component: NewDocumentComponent,
});

function NewDocumentComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const [content, setContent] = useState("");

  const contentMutation = useMutation({
    mutationFn: createDocument,
    onError: (error) => {
      toast.error(`Tạo tài liệu thất bại: ${error.message}`);
    },
    onSuccess: () => {
      toast.success("Tạo tài liệu thành công!");
      navigate({ to: "/document", replace: true });
    },
  });

  const handleSave = useCallback(() => {
    contentMutation.mutate({ content });
  }, [content, contentMutation]);

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
