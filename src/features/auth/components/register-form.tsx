"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";

import styles from "../auth.module.css";
import { AuthModeSwitch } from "./auth-mode-switch";

export function RegisterForm({
  schools,
}: {
  schools: Array<{ id: string; name: string; shortName: string }>;
}) {
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

    router.push("/profile");
    router.refresh();
  }

  return (
    <>
      <AuthModeSwitch activeMode="register" />
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
        <label>
          Scuola
          <select name="schoolId" defaultValue="" required>
            <option value="" disabled>
              Seleziona la tua scuola
            </option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name} ({school.shortName})
              </option>
            ))}
          </select>
        </label>
        <label>
          Instagram <span className={styles.optional}>(facoltativo)</span>
          <input name="instagram" placeholder="@username" />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Creazione account..." : "Registrati"}
        </button>
      </form>
    </>
  );
}
