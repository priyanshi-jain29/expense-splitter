import { useLocalSearchParams, useRouter } from "expo-router";

import AddExpenseScreen from "../../../../src/screens/AddExpenseScreen";

export default function AddExpenseRoute() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  return (
    <AddExpenseScreen
      groupId={groupId ?? ""}
      onBack={() => router.back()}
      onSave={() => router.replace(`/groups/${groupId ?? ""}`)}
    />
  );
}
