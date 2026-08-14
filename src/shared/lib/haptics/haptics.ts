import { Capacitor } from "@capacitor/core";
import { Haptics, NotificationType } from "@capacitor/haptics";

async function perform(effect: () => Promise<void>) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await effect();
  } catch {
    // Haptics are optional UX enhancement and must never interrupt a user action.
  }
}

export function selection() {
  return perform(async () => {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  });
}

export function success() {
  return perform(() => Haptics.notification({ type: NotificationType.Success }));
}

export function warning() {
  return perform(() => Haptics.notification({ type: NotificationType.Warning }));
}

export function error() {
  return perform(() => Haptics.notification({ type: NotificationType.Error }));
}
