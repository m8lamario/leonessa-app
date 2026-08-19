"use client";

import { Keyboard } from "@capacitor/keyboard";
import { Capacitor } from "@capacitor/core";
import { useEffect, useRef, useState } from "react";

import styles from "../auth.module.css";

const SCROLL_MARGIN_PX = 8;

export function useKeyboardFocusMode() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const keyboardHeightRef = useRef(0);

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
        const keyboardHeight = keyboardHeightRef.current;

        if (keyboardHeight <= 0) {
          return;
        }

        const rect = target.getBoundingClientRect();
        const visibleBottom = window.innerHeight - keyboardHeight + SCROLL_MARGIN_PX;

        if (rect.bottom <= visibleBottom) {
          return;
        }

        target.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
      }, 50);
    };
    document.addEventListener("focusin", keepFocusedControlVisible);

    const showListener = Keyboard.addListener("keyboardWillShow", () => setKeyboardOpen(true));
    const didShowListener = Keyboard.addListener("keyboardDidShow", (info) => {
      setKeyboardOpen(true);
      keyboardHeightRef.current = info.keyboardHeight;
    });
    const hideListener = Keyboard.addListener("keyboardWillHide", () => setKeyboardOpen(false));
    const didHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardOpen(false);
      keyboardHeightRef.current = 0;
    });

    return () => {
      document.removeEventListener("focusin", keepFocusedControlVisible);
      void Promise.all([showListener, didShowListener, hideListener, didHideListener]).then(
        (listeners) => Promise.all(listeners.map((listener) => listener.remove())),
      );
    };
  }, []);

  return keyboardOpen;
}

export function keyboardFocusClassName(keyboardOpen: boolean) {
  return keyboardOpen ? styles.keyboardFocusMode : "";
}
