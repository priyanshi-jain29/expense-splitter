import { useLocalSearchParams, useRouter } from "expo-router";

import ExpenseDetailScreen from "../../../../../src/screens/ExpenseDetailScreen";

export default function ExpenseDetailRoute() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();

  return (
    <ExpenseDetailScreen
      onBack={() => router.back()}
      onDelete={() => router.back()}
      onEdit={() => router.push(`/groups/${groupId ?? "goa"}/add-expense`)}
    />
  );
}
