"use server";

import { redirect } from "next/navigation";
import { AuthService } from "@/lib/auth/service";
import { DrizzleUserRepository } from "@/lib/auth/drizzle-repository";
import { getSession } from "@/lib/auth/session";
import { InvalidCredentialsError, UsernameTakenError } from "@/lib/auth/errors";

export type RegisterState = {
  error?: string;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const service = new AuthService(new DrizzleUserRepository());

  try {
    const user = await service.register({
      username: formData.get("username"),
      password: formData.get("password"),
    });

    const session = await getSession();
    session.userId = user.id;
    await session.save();
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return { error: "Ese nombre de usuario no está disponible." };
    }
    if (error instanceof InvalidCredentialsError) {
      return { error: "Revisá el usuario y la contraseña." };
    }
    return { error: "No se pudo completar el registro." };
  }

  redirect("/app");
}
