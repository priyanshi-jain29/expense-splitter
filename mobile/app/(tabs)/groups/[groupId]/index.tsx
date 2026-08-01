import { useLocalSearchParams, useRouter } from "expo-router";

import GroupDetailsScreen from "../../../../src/screens/GroupDetailsScreen";

export default function GroupDetailsRoute() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const currentGroupId = groupId ?? "goa";

  return (
    <GroupDetailsScreen
      onAddExpense={() => router.push(`/groups/${currentGroupId}/add-expense`)}
      onAddMembers={() => router.push(`/groups/${currentGroupId}/add-members`)}
      onBack={() => router.back()}
      onOpenExpense={(expenseId) =>
        router.push(`/groups/${currentGroupId}/expenses/${expenseId}`)
      }
      onSettleUp={() => router.push(`/groups/${currentGroupId}/settle-up`)}
    />
  );
}
