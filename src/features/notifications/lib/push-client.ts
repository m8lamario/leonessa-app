"use client";

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export type PushRegisterResult =
  | { status: "registered"; token: string }
  | { status: "denied" }
  | { status: "prompt_needed" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

async function postDevice(token: string, platform: string) {
  const response = await fetch("/api/push/devices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof payload.message === "string" ? payload.message : "Errore registrazione device",
    );
  }
}

/**
 * Registers the native push token with the backend.
 * By default does not request permission until `requestPermission` is true
 * (first follow flow).
 */
export async function ensurePushPermissionAndRegister(options?: {
  requestPermission?: boolean;
}): Promise<PushRegisterResult> {
  if (!Capacitor.isNativePlatform()) {
    return { status: "unsupported" };
  }

  try {
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === "prompt" || permission.receive === "prompt-with-rationale") {
      if (!options?.requestPermission) {
        return { status: "prompt_needed" };
      }
      permission = await PushNotifications.requestPermissions();
    }

    if (permission.receive !== "granted") {
      return { status: "denied" };
    }

    const token = await new Promise<string>((resolve, reject) => {
      let registrationHandle: { remove: () => Promise<void> } | undefined;
      let errorHandle: { remove: () => Promise<void> } | undefined;
      const timeout = window.setTimeout(() => {
        void registrationHandle?.remove();
        void errorHandle?.remove();
        reject(new Error("Token non disponibile"));
      }, 12_000);

      void PushNotifications.addListener("registration", (event) => {
        window.clearTimeout(timeout);
        void registrationHandle?.remove();
        void errorHandle?.remove();
        resolve(event.value);
      }).then((handle) => {
        registrationHandle = handle;
      });

      void PushNotifications.addListener("registrationError", (event) => {
        window.clearTimeout(timeout);
        void registrationHandle?.remove();
        void errorHandle?.remove();
        reject(new Error(event.error));
      }).then((handle) => {
        errorHandle = handle;
      });

      void PushNotifications.register();
    });

    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    await postDevice(token, platform);
    return { status: "registered", token };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Errore registrazione device",
    };
  }
}
