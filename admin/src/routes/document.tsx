import useAuthenticated from "@/lib/use-authenticated";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/document")({
  component: RouteComponent,
});

function RouteComponent() {
  useAuthenticated();
  return <Outlet />;
}
