"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useMemo, useState } from "react";

import { Button } from "@/shared/components/ui";

import styles from "../auth.module.css";
import { AuthModeSwitch } from "./auth-mode-switch";

type School = {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
};

type RegistrationValues = {
  fullName: string;
  schoolId: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export function RegisterForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [values, setValues] = useState<RegistrationValues>({
    fullName: "",
    schoolId: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });

  const selectedSchool = schools.find((school) => school.id === values.schoolId);
  const matchingSchools = useMemo(() => {
    const query = schoolQuery.trim().toLocaleLowerCase("it");

    if (!query) {
      return schools;
    }

    return schools.filter((school) =>
      `${school.name} ${school.shortName}`.toLocaleLowerCase("it").includes(query),
    );
  }, [schoolQuery, schools]);

  function updateValue<Key extends keyof RegistrationValues>(
    key: Key,
    value: RegistrationValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function getNameParts() {
    const parts = values.fullName.trim().split(/\s+/).filter(Boolean);

    return {
      name: parts[0] ?? "",
      surname: parts.slice(1).join(" "),
    };
  }

  function validateStep() {
    if (step === 0 && !getNameParts().surname) {
      setError("Inserisci nome e cognome.");
      return false;
    }

    if (step === 1 && !values.schoolId) {
      setError("Seleziona la tua scuola.");
      return false;
    }

    if (step === 2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError("Inserisci un indirizzo email valido.");
      return false;
    }

    if (step === 3) {
      if (values.password.length < 8) {
        setError("La password deve contenere almeno 8 caratteri.");
        return false;
      }

      if (!/[A-Za-z]/.test(values.password) || !/[0-9]/.test(values.password)) {
        setError("La password deve contenere almeno una lettera e un numero.");
        return false;
      }

      if (values.password !== values.passwordConfirmation) {
        setError("Le password non coincidono.");
        return false;
      }
    }

    return true;
  }

  function moveToNextStep() {
    if (validateStep()) {
      setStep((current) => current + 1);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < 4) {
      moveToNextStep();
      return;
    }

    setError(null);
    setPending(true);

    const { name, surname } = getNameParts();
    let response: Response;

    try {
      response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          surname,
          email: values.email,
          password: values.password,
          schoolId: values.schoolId,
        }),
      });
    } catch {
      setError("Non è stato possibile completare la registrazione. Riprova.");
      setPending(false);
      return;
    }

    const body = (await response.json()) as {
      message?: string;
      verificationEmailSent?: boolean;
      verificationMessage?: string;
    };

    if (!response.ok) {
      setError(body.message ?? "Registrazione non riuscita.");
      setPending(false);
      return;
    }

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      setError("Account creato. Effettua il login per continuare.");
      setPending(false);
      return;
    }

    if (!body.verificationEmailSent) {
      setError(
        body.verificationMessage ??
          "Account creato. Non è stato possibile inviare l'email di verifica: riprova dal banner nell'app.",
      );
      setPending(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div
          className={styles.progress}
          aria-label={step === 4 ? "Riepilogo" : `Passaggio ${step + 1} di 4`}
        >
          <span>{step === 4 ? "Riepilogo" : `${step + 1} / 4`}</span>
          <div className={styles.progressDots} aria-hidden="true">
            {[0, 1, 2, 3].map((progressStep) => (
              <i
                key={progressStep}
                className={progressStep <= Math.min(step, 3) ? styles.progressDotActive : undefined}
              />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            className={styles.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <>
                <h3>Benvenuto nella Leonessa Cup</h3>
                <p>Iniziamo da chi sei.</p>
                <label>
                  Nome e Cognome
                  <input
                    autoComplete="name"
                    autoFocus
                    name="fullName"
                    value={values.fullName}
                    onChange={(event) => updateValue("fullName", event.target.value)}
                  />
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <h3>Qual è la tua scuola?</h3>
                <p>Cerca e seleziona la scuola che rappresenti.</p>
                <label>
                  Ricerca scuola
                  <input
                    autoFocus
                    value={schoolQuery}
                    onChange={(event) => setSchoolQuery(event.target.value)}
                  />
                </label>
                <div
                  className={styles.schoolResults}
                  role="listbox"
                  aria-label="Scuole disponibili"
                >
                  {matchingSchools.map((school) => {
                    const schoolLogo =
                      school.logoUrl && school.logoUrl.startsWith("/") ? school.logoUrl : null;

                    return (
                      <button
                        key={school.id}
                        className={
                          school.id === values.schoolId
                            ? styles.schoolOptionSelected
                            : styles.schoolOption
                        }
                        type="button"
                        role="option"
                        aria-selected={school.id === values.schoolId}
                        onClick={() => {
                          updateValue("schoolId", school.id);
                          setSchoolQuery(school.name);
                        }}
                      >
                        {schoolLogo ? (
                          <Image
                            className={styles.schoolLogo}
                            src={schoolLogo}
                            alt=""
                            width={36}
                            height={36}
                          />
                        ) : (
                          <span className={styles.schoolBadge} aria-hidden="true">
                            {school.shortName.slice(0, 2)}
                          </span>
                        )}
                        <span>
                          {school.name}
                          <small>{school.shortName}</small>
                        </span>
                      </button>
                    );
                  })}
                  {matchingSchools.length === 0 && (
                    <p className={styles.emptySchools}>Nessuna scuola trovata.</p>
                  )}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h3>Inserisci la tua email</h3>
                <p>La userai per entrare nella tua area personale.</p>
                <label>
                  Email
                  <input
                    autoComplete="email"
                    autoFocus
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={(event) => updateValue("email", event.target.value)}
                  />
                </label>
              </>
            )}
            {step === 3 && (
              <>
                <h3>Proteggi il tuo account</h3>
                <p>Usa almeno 8 caratteri, una lettera e un numero.</p>
                <label>
                  Password
                  <input
                    autoComplete="new-password"
                    autoFocus
                    name="password"
                    type="password"
                    value={values.password}
                    onChange={(event) => updateValue("password", event.target.value)}
                  />
                </label>
                <label>
                  Conferma password
                  <input
                    autoComplete="new-password"
                    name="passwordConfirmation"
                    type="password"
                    value={values.passwordConfirmation}
                    onChange={(event) => updateValue("passwordConfirmation", event.target.value)}
                  />
                </label>
              </>
            )}
            {step === 4 && (
              <>
                <h3>Pronto a entrare?</h3>
                <p>Controlla i dati prima di creare il tuo account.</p>
                <dl className={styles.summary}>
                  <div>
                    <dt>Nome</dt>
                    <dd>{values.fullName}</dd>
                  </div>
                  <div>
                    <dt>Scuola</dt>
                    <dd>{selectedSchool?.name}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{values.email}</dd>
                  </div>
                </dl>
              </>
            )}
          </motion.div>
        </AnimatePresence>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.stepActions}>
          {step > 0 && (
            <Button
              disabled={pending}
              type="button"
              variant="ghost"
              onClick={() => setStep((current) => current - 1)}
            >
              Indietro
            </Button>
          )}
          <Button className={styles.stepCta} disabled={pending} type="submit">
            {pending
              ? "Creazione account..."
              : step === 4
                ? "Completa la registrazione"
                : "Continua"}
          </Button>
        </div>
      </form>
      <footer className={styles.authFooter}>
        <p>Hai già un account?</p>
        <AuthModeSwitch activeMode="register" />
      </footer>
    </>
  );
}
