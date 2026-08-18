import { env } from "@/env";

export const dynamic = "force-dynamic";

export function GET() {
  if (!env.APPLE_TEAM_ID) {
    return Response.json(
      { message: "Configurazione Universal Links non disponibile." },
      { status: 503 },
    );
  }

  return Response.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appID: `${env.APPLE_TEAM_ID}.it.leonessa.platform`,
            paths: ["/verify-email*", "/reset-password*"],
          },
        ],
      },
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
