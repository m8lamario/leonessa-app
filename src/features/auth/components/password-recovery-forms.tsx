"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Button } from "@/shared/components/ui";

import styles from "../auth.module.css";

type FormState = {
  message: string | null;
  error: string | null;
  pending: boolean;
};

const initialState: FormState = { message: null, error: null, pending: false };

async function getResponseMessage(response: Response) {
  const body = (await response.json()) as { message?: string };

  return body.message ?? "Si è verificato un errore. Riprova.";
}

export function PasswordRecoveryRequestForm() {
  const [state, setState] = useState(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ ...initialState, pending: true });

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const message = await getResponseMessage(response);

      setState(response.ok ? { ...initialState, message } : { ...initialState, error: message });
    } catch {
      setState({ ...initialState, error: "Non è stato possibile inviare il link. Riprova." });
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.formIntro}>
        Inserisci l&apos;email del tuo account: ti invieremo un link sicuro per scegliere una nuova
        password.
      </p>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className={styles.success} role="status">
          {state.message}
        </p>
      )}
      <Button className={styles.fullWidth} disabled={state.pending} type="submit">
        {state.pending ? "Invio in corso..." : "Invia link di recupero"}
      </Button>
      <Link className={styles.authLink} href="/login">
        Torna all&apos;accesso
      </Link>
    </form>
  );
}

export function PasswordResetForm({ token }: { token: string | undefined }) {
  const [state, setState] = useState(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setState({ ...initialState, error: "Il link di recupero non è valido." });
      return;
    }

    setState({ ...initialState, pending: true });
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/password-reset", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.get("password"),
          passwordConfirmation: formData.get("passwordConfirmation"),
        }),
      });
      const message = await getResponseMessage(response);

      setState(response.ok ? { ...initialState, message } : { ...initialState, error: message });
    } catch {
      setState({
        ...initialState,
        error: "Non è stato possibile aggiornare la password. Riprova.",
      });
    }
  }

  if (state.message) {
    return (
      <div className={styles.form}>
        <p className={styles.success} role="status">
          {state.message}
        </p>
        <Link className={styles.authLink} href="/login">
          Accedi con la nuova password
        </Link>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.formIntro}>
        Scegli una password di almeno 8 caratteri, con una lettera e un numero.
      </p>
      <label>
        Nuova password
        <input name="password" type="password" autoComplete="new-password" required />
      </label>
      <label>
        Conferma password
        <input name="passwordConfirmation" type="password" autoComplete="new-password" required />
      </label>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <Button className={styles.fullWidth} disabled={state.pending || !token} type="submit">
        {state.pending ? "Aggiornamento in corso..." : "Aggiorna password"}
      </Button>
    </form>
  );
}
