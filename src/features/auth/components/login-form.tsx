"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

import styles from "../auth.module.css";

export function LoginForm({ callbackUrl = "/profile" }: { callbackUrl?: string }) {
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

    const destination = callbackUrl === "/onboarding" ? "/onboarding" : "/profile";
    router.push(destination);
    router.refresh();
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>
      <button
        className={styles.secondaryButton}
        type="button"
        onClick={() => signIn("google", { callbackUrl })}
      >
        Continua con Google
      </button>
      <p className={styles.footerText}>
        Non hai ancora un account? <Link href="/register">Registrati</Link>
      </p>
    </>
  );
}
