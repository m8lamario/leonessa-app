import { NextResponse } from "next/server";

import { requireUser } from "@/features/auth/server/guards";
import { disablePushDevice, registerPushDevice } from "@/features/notifications/server";
import { AppError } from "@/utils/errors";

export const dynamic = "force-dynamic";

function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status },
    );
  }
  throw error;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => ({}))) as {
      token?: unknown;
      platform?: unknown;
    };
    const token = typeof body.token === "string" ? body.token : "";
    const platform = typeof body.platform === "string" ? body.platform : "";
    const device = await registerPushDevice({ userId: user.id, token, platform });
    return NextResponse.json({
      result: {
        id: device.id,
        platform: device.platform,
        enabled: device.enabled,
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json().catch(() => ({}))) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token : "";
    if (!token) {
      throw new AppError("BAD_REQUEST", "Token push non disponibile.", 400);
    }
    const device = await disablePushDevice(user.id, token);
    return NextResponse.json({
      result: { id: device.id, enabled: device.enabled },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
