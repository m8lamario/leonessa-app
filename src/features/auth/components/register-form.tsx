"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

import styles from "../auth.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });

    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setError(body.message ?? "Registrazione non riuscita.");
      setPending(false);
      return;
    }

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (!result || result.error) {
      setError("Account creato. Effettua il login per continuare.");
      setPending(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Nome
          <input name="name" autoComplete="given-name" required />
        </label>
        <label>
          Cognome
          <input name="surname" autoComplete="family-name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Creazione account..." : "Registrati"}
        </button>
      </form>
      <p className={styles.footerText}>
        Hai già un account? <Link href="/login">Accedi</Link>
      </p>
    </>
  );
}
