import { useRouter } from "expo-router";

import MyGroupsScreen from "../../../src/screens/MyGroupsScreen";

export default function GroupsRoute() {
  const router = useRouter();

  return (
    <MyGroupsScreen
      onCreateGroup={() => router.push("/groups/create")}
      onOpenGroup={(groupId) => router.push(`/groups/${groupId}`)}
      onSignedOut={() => router.replace("/login")}
    />
  );
}
