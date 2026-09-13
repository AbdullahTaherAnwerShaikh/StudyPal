"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase-server";

export type AccountResult = {
  ok: boolean;
  error?: string;
  message?: string;
  pendingEmail?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

function asError(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export async function updateProfileInfo(input: {
  displayName: string;
  username: string;
}): Promise<AccountResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in." };

    const displayName = input.displayName.trim();
    if (displayName.length < 1 || displayName.length > 60) {
      return {
        ok: false,
        error: "Display name must be between 1 and 60 characters.",
      };
    }

    const username = input.username.trim();
    if (!USERNAME_RE.test(username)) {
      return {
        ok: false,
        error:
          "Username must be 3\u201320 characters using letters, numbers, or underscores.",
      };
    }

    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName, username },
    });
    if (error) {
      return { ok: false, error: `Couldn't update your profile: ${error.message}` };
    }

    revalidatePath("/settings/profile");
    return { ok: true, message: "Profile updated." };
  } catch (err) {
    return { ok: false, error: asError(err) };
  }
}

export async function changeEmail(input: {
  newEmail: string;
}): Promise<AccountResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in." };

    const newEmail = input.newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(newEmail) || newEmail.length > 254) {
      return { ok: false, error: "Enter a valid email address." };
    }
    if (newEmail === user.email?.toLowerCase()) {
      return { ok: false, error: "That's already your current email." };
    }

    const origin = (await headers()).get("origin");
    const emailRedirectTo = origin
      ? `${origin}/auth/callback?next=/settings/account`
      : undefined;

    const { data, error } = await supabase.auth.updateUser(
      { email: newEmail },
      emailRedirectTo ? { emailRedirectTo } : {}
    );
    if (error) {
      return { ok: false, error: `Email change failed: ${error.message}` };
    }

    const changed =
      typeof data.user?.email === "string" &&
      data.user.email.toLowerCase() === newEmail;

    if (changed) {
      return { ok: true, message: "Email address updated." };
    }

    return {
      ok: true,
      pendingEmail: newEmail,
      message: `We sent a confirmation link to ${newEmail}. Click it to finish changing your email.`,
    };
  } catch (err) {
    return { ok: false, error: asError(err) };
  }
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AccountResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in." };
    if (!user.email) {
      return {
        ok: false,
        error: "No email on file \u2014 password changes need an email login.",
      };
    }

    const { currentPassword, newPassword } = input;
    if (!currentPassword) {
      return { ok: false, error: "Enter your current password." };
    }
    if (newPassword.length < 8) {
      return {
        ok: false,
        error: "New password must be at least 8 characters.",
      };
    }
    if (newPassword === currentPassword) {
      return {
        ok: false,
        error: "New password must be different from your current password.",
      };
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      const message = signInError.message.toLowerCase().includes("invalid login")
        ? "Your current password is incorrect."
        : `Couldn't verify your current password: ${signInError.message}`;
      return { ok: false, error: message };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { ok: false, error: `Password change failed: ${error.message}` };
    }

    return { ok: true, message: "Your password has been updated." };
  } catch (err) {
    return { ok: false, error: asError(err) };
  }
}

export async function deleteAccount(): Promise<AccountResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "You must be signed in." };

    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      const isMissingFunction =
        error.code === "PGRST202" ||
        error.message.includes("delete_my_account");
      return {
        ok: false,
        error: isMissingFunction
          ? "Account deletion isn't set up yet \u2014 the delete function (migration 0007) has to be run in Supabase first."
          : `Couldn't delete your account: ${error.message}`,
      };
    }

    await supabase.auth.signOut();
    return { ok: true, message: "Your account and data have been deleted." };
  } catch (err) {
    return { ok: false, error: asError(err) };
  }
}