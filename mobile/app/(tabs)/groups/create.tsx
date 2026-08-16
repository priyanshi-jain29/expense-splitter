import { useRouter } from "expo-router";

import { API_BASE_URL } from "../../../src/config/api";
import { authClient } from "../../../src/config/auth-client";
import CreateGroupScreen from "../../../src/screens/CreateGroupScreen";

export default function CreateGroupRoute() {
  const router = useRouter();

  const createGroup = async (name: string) => {
    const { data: session, error: sessionError } =
      await authClient.getSession();
    if (sessionError || !session?.user.id) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, userId: session.user.id }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(
        body?.error ?? `Request failed with status ${response.status}`,
      );
    }

    router.back();
  };

  return (
    <CreateGroupScreen
      onBack={() => router.back()}
      onCreate={createGroup}
    />
  );
}
