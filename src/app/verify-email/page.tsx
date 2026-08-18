import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckBig, Sparkles } from "lucide-react";

import { AuthCard } from "@/features/auth/components/auth-card";
import { verifyEmail } from "@/features/auth/server/account-service";
import styles from "@/features/auth/auth.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verifica email | Leonessa",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token && /^[a-f0-9]{64}$/i.test(token) ? await verifyEmail(token) : "invalid";
  const verificationComplete = result === "verified" || result === "already-verified";

  return (
    <AuthCard title={verificationComplete ? "Account verificato" : "Verifica email"}>
      {verificationComplete ? (
        <div className={styles.verificationSuccess}>
          <CircleCheckBig aria-hidden="true" className={styles.verificationIcon} />
          <p className={styles.verificationEyebrow}>Benvenuto nella community</p>
          <p className={styles.formIntro}>
            {result === "verified"
              ? "La tua email è verificata. Ora il tuo profilo Leonessa Cup è completo."
              : "La tua email è già verificata e il tuo account è pronto."}
          </p>
          {result === "verified" && (
            <div className={styles.verificationReward}>
              <Sparkles aria-hidden="true" size={20} />
              <span>
                <strong>+25 LP</strong>
                ottenuti
              </span>
            </div>
          )}
          <Link className={styles.verificationDashboardLink} href="/dashboard">
            Vai alla Dashboard
          </Link>
        </div>
      ) : (
        <div className={styles.verificationResult}>
          <p className={styles.formIntro}>
            {result === "expired"
              ? "Questo link è scaduto. Accedi per richiederne uno nuovo."
              : "Questo link non è valido o è già stato utilizzato."}
          </p>
          <Link className={styles.authLink} href="/login">
            Vai all&apos;accesso
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
