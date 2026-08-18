import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import type { CapacitorConfig } from "@capacitor/cli";

for (const envFile of [".env.local", ".env"]) {
  if (existsSync(envFile)) {
    loadEnvFile(envFile);
  }
}

const config: CapacitorConfig = {
  appId: "it.leonessa.platform",
  appName: "Leonessa",
  // The app is server-rendered; the native shell uses CAPACITOR_SERVER_URL.
  webDir: "public",
  server: {
    androidScheme: "http",
    url: process.env.CAPACITOR_SERVER_URL,
    cleartext: process.env.NODE_ENV !== "production",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
