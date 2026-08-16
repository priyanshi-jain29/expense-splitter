import { useRouter } from "expo-router";

import { API_BASE_URL, TEST_USER_ID } from "../../../src/config/api";
import CreateGroupScreen from "../../../src/screens/CreateGroupScreen";

export default function CreateGroupRoute() {
  const router = useRouter();

  const createGroup = async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, userId: TEST_USER_ID }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
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
