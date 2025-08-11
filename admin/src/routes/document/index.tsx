import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import z from "zod";
import { listDocuments, type Document } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/document/")({
  validateSearch: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    pageSize: z.coerce.number().int().min(1).max(100).catch(20),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const search = Route.useSearch();
  const page = (search as { page?: number }).page ?? 1;
  const pageSize = (search as { pageSize?: number }).pageSize ?? 20;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["documents", { page, pageSize }],
    queryFn: () => listDocuments({ page, pageSize }),
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.totalItems ?? 0;

  const goTo = (nextPage: number, nextPageSize = pageSize) =>
    navigate({
      search: (prev) => ({
        ...prev,
        page: Math.max(1, nextPage),
        pageSize: nextPageSize,
      }),
    });

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (isError)
    return (
      <div className="p-6 text-destructive">{(error as Error).message}</div>
    );

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Tài liệu</h1>
        <div className="text-sm text-muted-foreground">Tổng: {totalItems}</div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Nội dung</TableHead>
            <TableHead className="w-[180px]">Thời gian tạo</TableHead>
            <TableHead className="w-[180px]">Thời gian cập nhật</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((doc: Document) => (
            <TableRow key={doc.id}>
              <TableCell className="font-mono text-xs">{doc.id}</TableCell>
              <TableCell>
                <div className="max-w-[700px] truncate" title={doc.content}>
                  {doc.content}
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(doc.createdAt).toLocaleString()}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(doc.updatedAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground"
              >
                No documents found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page{" "}
            <span className="font-medium">{page}</span> of
            <span className="font-medium"> {totalPages}</span>
          </div>
          <Button
            variant="outline"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="pageSize" className="text-sm text-muted-foreground">
            Rows per page
          </label>
          <select
            id="pageSize"
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
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
    </div>
  );
}
