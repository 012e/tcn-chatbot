import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAtom } from "jotai";
import { loginCredentialAtom } from "@/store/login-credential";
import { toast } from "sonner";

function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [, setCredential] = useAtom(loginCredentialAtom);
  const navigate = useNavigate({ from: Route.fullPath });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    setCredential({
      username,
      password,
    });
    // TOOD: check login success
    toast.success("Đăng nhập thành công!");

    navigate({ to: "/chat" });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Đăng nhập vào tài khoản của bạn</CardTitle>
          <CardDescription>
            Nhập tên người dùng của bạn dưới đây để đăng nhập
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="username">Tên người dùng</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="tên người dùng"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <a
                    href="#"
                    className="inline-block ml-auto text-sm hover:underline underline-offset-4"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Đăng nhập
                </Button>
              </div>
            </div>
            <div className="mt-4 text-sm text-center">
              Bạn chưa có tài khoản?{" "}
              <a href="#" className="underline underline-offset-4">
                Đăng ký
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteComponent() {
  return (
    <div className="flex justify-center items-center p-6 w-full md:p-10 min-h-svh">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
