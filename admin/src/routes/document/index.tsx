import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { listDocuments, type Document, deleteDocument } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as React from "react";
import { toast } from "sonner";
import { Trash, Edit } from "lucide-react";
import dompurify from "dompurify";

export const Route = createFileRoute("/document/")({
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    pageSize: z.coerce.number().int().min(1).max(100).catch(20),
    id: z.coerce.number().int().optional().catch(undefined),
  }),
  component: RouteComponent,
});

function stripHtmlTags(htmlString: string) {
  return htmlString.replace(/<[^>]*>/g, "");
}

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const queryClient = useQueryClient();
  const { page, pageSize, id: selectedId } = Route.useSearch();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["documents", { page, pageSize }],
    queryFn: () => listDocuments({ page, pageSize }),
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  const docFromUrl = React.useMemo(() => {
    const doc = items.find(
      (d) => d.id === selectedId,
    ) as (typeof items)[number] & { sanitizedContent: string };
    if (!doc) return null;
    doc.content = dompurify.sanitize(doc.content);
    doc.sanitizedContent = doc.content;
    return doc;
  }, [items, selectedId]);

  const [docToDelete, setDocToDelete] = React.useState<Document | null>(null);

  const goTo = (nextPage: number, nextPageSize = pageSize) =>
    navigate({
      search: (prev) => ({
        ...prev,
        page: Math.max(1, nextPage),
        pageSize: nextPageSize,
      }),
    });

  const onSelect = (doc: Document) =>
    navigate({
      search: (prev) => ({ ...prev, id: doc.id }),
    });

  const onCloseDialog = () =>
    navigate({
      search: (prev) => ({ ...prev, id: undefined }),
    });

  const onOpenDeleteDialog = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setDocToDelete(doc);
  };

  const handleDeleteConfirmed = async () => {
    if (!docToDelete) return;

    const deletePromise = deleteDocument(docToDelete.id);
    toast.promise(deletePromise, {
      loading: "Đang xóa tài liệu...",
      success: "Tài liệu đã được xóa",
      error: (err) => `Xóa tài liệu thất bại: ${err.message}`,
    });

    await deletePromise;
    const updateDataPromise = queryClient.invalidateQueries({
      queryKey: ["documents"],
    });
    toast.promise(updateDataPromise, {
      loading: "Đang cập nhật danh sách tài liệu...",
      success: "Danh sách tài liệu đã được cập nhật",
      error: (err) => `Cập nhật danh sách thất bại: ${err.message}`,
    });
    navigate({
      search: (prev) => ({
        ...prev,
        id: prev?.id === docToDelete.id ? undefined : prev?.id,
      }),
    });
    setDocToDelete(null);
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError)
    return (
      <div className="p-6 text-destructive">{(error as Error).message}</div>
    );

  return (
    <div className="flex flex-col gap-4 p-6 bg-background text-foreground">
      <div className="flex gap-2 justify-between items-begin">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài liệu</h1>
          <div className="text-sm text-muted-foreground">
            Tổng: {totalItems}
          </div>
        </div>
        <Button
          onClick={() => navigate({ to: "/document/new" })}
          className="h-9 text-white bg-green-400 transition-colors cursor-pointer hover:bg-green-500"
        >
          Tạo mới
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">ID</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="w-[180px]">Ngày tạo</TableHead>
              <TableHead className="w-[180px]">Ngày cập nhật</TableHead>
              <TableHead className="text-right w-[160px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((doc: Document) => {
              const strippedContent = stripHtmlTags(doc.content);
              return (
                <TableRow
                  key={doc.id}
                  onClick={() => onSelect(doc)}
                  className="cursor-pointer transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  data-state={selectedId === doc.id ? "selected" : "unselected"}
                >
                  <TableCell className="font-mono text-xs">{doc.id}</TableCell>
                  <TableCell>
                    <div
                      className="max-w-[700px] truncate"
                      title={strippedContent}
                    >
                      {strippedContent}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(doc.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(doc.updatedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({ to: `/document/${doc.id}/edit` });
                        }}
                      >
                        <Edit className="size-4" />
                        Sửa
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="cursor-pointer"
                        onClick={(e) => onOpenDeleteDialog(e, doc)}
                      >
                        <Trash className="size-4" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
          >
            Trước
          </Button>
          <div className="text-sm">
            Trang <span className="font-medium">{page}</span> /{" "}
            <span className="font-medium"> {totalPages}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
          >
            Tiếp
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <label htmlFor="pageSize" className="text-sm text-muted-foreground">
            Kích thước trang:
          </label>
          <select
            id="pageSize"
            className="px-2 h-9 text-sm bg-transparent rounded-md border focus:ring-2 focus:ring-offset-2 focus:outline-none border-input focus:ring-ring focus:ring-offset-background"
            value={pageSize}
            onChange={(e) => goTo(1, Number(e.target.value))}
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Dialog
        open={!!selectedId}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            onCloseDialog();
          }
        }}
      >
        {docFromUrl && (
          <DialogContent className="sm:max-w-3xl">
            <>
              <DialogHeader>
                <DialogTitle>Document #{docFromUrl.id}</DialogTitle>
              </DialogHeader>
              <div
                dangerouslySetInnerHTML={{
                  __html: docFromUrl.sanitizedContent,
                }}
              />{" "}
              {/* The content is sanitized*/}
            </>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog
        open={!!docToDelete}
        onOpenChange={() => {
          setDocToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tài liệu sẽ bị xóa vĩnh viễn và
              toàn bộ dữ liệu của nó sẽ bị xóa khỏi máy chủ của chúng tôi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>
              Tiếp tục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
