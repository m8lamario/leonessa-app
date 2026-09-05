"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";

import { nextFollowCounts } from "../lib/follow-domain";
import styles from "../profile.module.css";

type FollowButtonProps = {
  profileId: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
  onStateChange?: (state: { following: boolean; followerCount: number }) => void;
};

export function FollowButton({
  profileId,
  initialFollowing,
  initialFollowerCount,
  onStateChange,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFollow() {
    if (pending) return;
    setPending(true);
    setError(null);
    const previousFollowing = following;
    const previousCount = followerCount;
    const nextFollowing = !following;
    const nextCount = nextFollowCounts({
      followerCount,
      following: previousFollowing,
      nextFollowing,
    });
    setFollowing(nextFollowing);
    setFollowerCount(nextCount);
    onStateChange?.({ following: nextFollowing, followerCount: nextCount });

    try {
      const response = await fetch(`/api/users/${profileId}/follow`, {
        method: nextFollowing ? "POST" : "DELETE",
        credentials: "same-origin",
      });
      const body = (await response.json()) as {
        result?: { following?: boolean; followerCount?: number };
        message?: string;
      };
      if (!response.ok) {
        setFollowing(previousFollowing);
        setFollowerCount(previousCount);
        onStateChange?.({ following: previousFollowing, followerCount: previousCount });
        setError(body.message ?? "Operazione non riuscita. Riprova.");
        return;
      }
      const confirmedFollowing =
        typeof body.result?.following === "boolean" ? body.result.following : nextFollowing;
      const confirmedCount =
        typeof body.result?.followerCount === "number" ? body.result.followerCount : nextCount;
      setFollowing(confirmedFollowing);
      setFollowerCount(confirmedCount);
      onStateChange?.({ following: confirmedFollowing, followerCount: confirmedCount });
      router.refresh();
    } catch {
      setFollowing(previousFollowing);
      setFollowerCount(previousCount);
      onStateChange?.({ following: previousFollowing, followerCount: previousCount });
      setError("Errore di rete. Riprova.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.followActions}>
      <button
        aria-pressed={following}
        className={following ? styles.followButtonActive : styles.followButton}
        disabled={pending}
        onClick={() => void toggleFollow()}
        type="button"
      >
        {following ? <UserCheck aria-hidden="true" size={16} /> : <UserPlus aria-hidden="true" size={16} />}
        {following ? "Segui già" : "Segui"}
      </button>
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
