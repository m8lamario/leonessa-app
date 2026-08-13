import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "it.leonessa.platform",
  appName: "Leonessa",
  // The app is server-rendered; the native shell uses CAPACITOR_SERVER_URL.
  webDir: "public",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
    url: process.env.CAPACITOR_SERVER_URL,
    cleartext: process.env.NODE_ENV !== "production",
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
