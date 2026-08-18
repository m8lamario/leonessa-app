import { env } from "@/env";

export const dynamic = "force-dynamic";

export function GET() {
  if (!env.ANDROID_APP_LINK_SHA256) {
    return Response.json(
      { message: "Configurazione Android App Links non disponibile." },
      { status: 503 },
    );
  }

  return Response.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "it.leonessa.platform",
          sha256_cert_fingerprints: env.ANDROID_APP_LINK_SHA256.split(",").map((value) =>
            value.trim(),
          ),
        },
      },
    ],
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
