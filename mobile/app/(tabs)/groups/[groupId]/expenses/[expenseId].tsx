import { useLocalSearchParams, useRouter } from "expo-router";

import ExpenseDetailScreen from "../../../../../src/screens/ExpenseDetailScreen";

export default function ExpenseDetailRoute() {
  const router = useRouter();
  const { groupId, expenseId } = useLocalSearchParams<{
    groupId: string;
    expenseId: string;
  }>();

  return (
    <ExpenseDetailScreen
      expenseId={expenseId ?? ""}
      onBack={() => router.back()}
      onDeleted={() => router.replace(`/groups/${groupId ?? ""}`)}
    />
  );
}
