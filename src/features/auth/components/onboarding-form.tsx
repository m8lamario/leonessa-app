"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../auth.module.css";

export function OnboardingForm({
  initialName,
  initialSurname,
  initialInstagram,
  schools,
}: {
  initialName: string;
  initialSurname: string;
  initialInstagram: string;
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
    const response = await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });

    if (!response.ok) {
      const body = (await response.json()) as { message?: string };
      setError(body.message ?? "Non è stato possibile salvare il profilo.");
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label>
        Nome
        <input name="name" defaultValue={initialName} autoComplete="given-name" required />
      </label>
      <label>
        Cognome
        <input name="surname" defaultValue={initialSurname} autoComplete="family-name" required />
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
        <input name="instagram" defaultValue={initialInstagram} placeholder="@username" />
      </label>
      {error && <p className={styles.error}>{error}</p>}
      <button className={styles.primaryButton} disabled={pending} type="submit">
        {pending ? "Salvataggio..." : "Completa il profilo"}
      </button>
    </form>
  );
}
