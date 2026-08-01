"use client";

import { MessageCircle, User } from "lucide-react";
import { motion } from "framer-motion";
import LoginButton from "../loginButton";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCredits } from "../../hooks/useCredits";
import CreditsBalanceButton from "../CreditsBalanceButton";

type ProfileMenuProps = {
  onBuyCredits?: () => void;
  onClose?: () => void;
};

export default function ProfileMenu({ onBuyCredits, onClose }: ProfileMenuProps) {
  const { user, isLoading } = useUser();
  const { credits, isLoadingCredits } = useCredits();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="flex min-w-[12rem] flex-col gap-2 rounded-almaari border border-almaari-border/60 bg-almaari-surface-raised p-2 shadow-soft"
      onClick={(e) => e.stopPropagation()}
      role="menu"
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        {isLoading ? (
          <span className="text-sm text-almaari-muted">Loading…</span>
        ) : user ? (
          <div className="inline-flex max-w-full items-center gap-2 truncate text-sm font-medium text-almaari-ink">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{user.email}</span>
          </div>
        ) : (
          <span className="text-sm">Logged out</span>
        )}
      </div>

      {onBuyCredits ? (
        <CreditsBalanceButton
          credits={credits}
          isLoading={isLoadingCredits}
          onBuyCredits={() => {
            onClose?.();
            onBuyCredits();
          }}
          compact
        />
      ) : null}

      <button
        type="button"
        role="menuitem"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-almaari-ink hover:bg-almaari-accent-soft"
        onClick={() => {
          onClose?.();
          window.location.href = "/feedback";
        }}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Feedback
      </button>

      <LoginButton onNavigate={onClose} />
    </motion.div>
  );
}
