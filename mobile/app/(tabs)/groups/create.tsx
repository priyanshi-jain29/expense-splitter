import { useRouter } from "expo-router";

import CreateGroupScreen from "../../../src/screens/CreateGroupScreen";

export default function CreateGroupRoute() {
  const router = useRouter();

  return (
    <CreateGroupScreen
      onBack={() => router.back()}
      onCreate={() => router.replace("/groups/new-group")}
    />
  );
}
