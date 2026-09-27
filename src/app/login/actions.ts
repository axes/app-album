"use server";

import { redirect } from "next/navigation";
import { AuthService } from "@/lib/auth/service";
import { DrizzleUserRepository } from "@/lib/auth/drizzle-repository";
import { getSession } from "@/lib/auth/session";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const service = new AuthService(new DrizzleUserRepository());

  try {
    const user = await service.login({
      username: formData.get("username"),
      password: formData.get("password"),
    });

    const session = await getSession();
    session.userId = user.id;
    await session.save();
  } catch {
    // Generic message: never reveal whether the username exists.
    return { error: "Usuario o contraseña incorrectos." };
  }

  redirect("/app");
}
