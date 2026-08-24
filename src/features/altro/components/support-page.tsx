"use client";

import { EmptyState, PageContainer } from "@/shared/components";

import styles from "../altro.module.css";
import { HubSubheader } from "./hub-subheader";

type SupportPageProps = {
  title: string;
  kicker: string;
  lead: string;
  emptyTitle: string;
  emptyMessage: string;
};

export function SupportPage({
  title,
  kicker,
  lead,
  emptyTitle,
  emptyMessage,
}: SupportPageProps) {
  return (
    <PageContainer className={styles.page}>
      <HubSubheader kicker={kicker} lead={lead} title={title} />
      <div className={styles.content}>
        <EmptyState title={emptyTitle} message={emptyMessage} />
      </div>
    </PageContainer>
  );
}
