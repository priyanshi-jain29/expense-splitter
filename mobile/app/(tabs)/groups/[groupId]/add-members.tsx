import { useRouter } from "expo-router";

import AddMembersScreen from "../../../../src/screens/AddMembersScreen";

export default function AddMembersRoute() {
  const router = useRouter();

  return (
    <AddMembersScreen
      onBack={() => router.back()}
      onDone={() => router.back()}
    />
  );
}
