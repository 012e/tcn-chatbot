import { useAtom } from "jotai";
import { useEffect } from "react";
import { redirect, useNavigate } from "@tanstack/react-router";
import { loginCredentialAtom } from "@/store/login-credential";

export default function useAuthenticated() {
  const navigate = useNavigate();
  const [credential] = useAtom(loginCredentialAtom);
  useEffect(() => {
    if (!credential || !credential.username || !credential.password) {
      navigate({ to: "/login" });
    }
  }, [credential, redirect, credential?.username, credential?.password]);
}
