"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import Link from "next/link";

import { Button } from "@/shared/components/ui";

import styles from "../auth.module.css";
import { AuthModeSwitch } from "./auth-mode-switch";

export function LoginForm({ callbackUrl = "/dashboard" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (!result || result.error) {
      setError("Email o password non validi.");
      setPending(false);
      return;
    }

    const destination =
      callbackUrl === "/dashboard" || callbackUrl === "/onboarding" || callbackUrl === "/profile"
        ? callbackUrl
        : "/dashboard";
    router.push(destination);
    router.refresh();
  }

  return (
    <>
      <Button
        className={`${styles.fullWidth} ${styles.googleButton}`}
        disabled={pending}
        type="button"
        variant="secondary"
        onClick={() => signIn("google", { callbackUrl })}
      >
        <span className={styles.googleMark} aria-hidden="true">
          G
        </span>
        Continua con Google
      </Button>
      <div className={styles.divider} aria-hidden="true">
        <span />
        oppure
        <span />
      </div>
      <form className={`${styles.form} ${styles.loginForm}`} onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <Button className={styles.fullWidth} disabled={pending} type="submit">
          {pending ? "Accesso in corso..." : "Accedi"}
        </Button>
      </form>
      <Link className={styles.forgotPassword} href="/forgot-password">
        Password dimenticata?
      </Link>
      <footer className={styles.authFooter}>
        <p>Non hai un account?</p>
        <AuthModeSwitch activeMode="login" />
      </footer>
    </>
  );
}
