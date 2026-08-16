import { useLocalSearchParams, useRouter } from "expo-router";

import AddMembersScreen from "../../../../src/screens/AddMembersScreen";

export default function AddMembersRoute() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  return (
    <AddMembersScreen
      groupId={groupId ?? ""}
      onBack={() => router.back()}
      onDone={() => router.back()}
    />
  );
}
