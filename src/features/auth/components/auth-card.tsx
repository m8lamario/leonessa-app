"use client";

import { motion } from "framer-motion";
import Image from "next/image";

import styles from "../auth.module.css";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className={styles.page}>
      <motion.section
        className={styles.card}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.brandLockup}>
          <div className={styles.logoContainer}>
            <Image
              className={styles.logoImage}
              src="/logo/logo leonessa bianco.png"
              alt="Logo Leonessa Cup"
              width={1986}
              height={2744}
              priority
            />
          </div>
        </div>
        <h1>{title}</h1>
        {children}
      </motion.section>
    </main>
  );
}
