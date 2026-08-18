"use client";

import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

import styles from "../auth.module.css";

export function useKeyboardFocusMode() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const keepFocusedControlVisible = (event: FocusEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
        return;
      }

      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }, 180);
    };
    document.addEventListener("focusin", keepFocusedControlVisible);

    const showListener = Keyboard.addListener("keyboardWillShow", () => setKeyboardOpen(true));
    const didShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hideListener = Keyboard.addListener("keyboardWillHide", () => setKeyboardOpen(false));
    const didHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));

    return () => {
      document.removeEventListener("focusin", keepFocusedControlVisible);
      void Promise.all([showListener, didShowListener, hideListener, didHideListener]).then(
        (listeners) => Promise.all(listeners.map((listener) => listener.remove())),
      );
    };
  }, []);

  return keyboardOpen;
}

export function keepInputVisible(event: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  window.setTimeout(() => {
    event.currentTarget.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, 180);
}

export function keyboardFocusClassName(keyboardOpen: boolean) {
  return keyboardOpen ? styles.keyboardFocusMode : "";
}
