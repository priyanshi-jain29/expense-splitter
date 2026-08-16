import { useRouter } from "expo-router";

import ActivityFeedScreen from "../../src/screens/ActivityFeedScreen";

export default function ActivityRoute() {
  const router = useRouter();

  return (
    <ActivityFeedScreen
      onOpenExpense={(groupId, expenseId) =>
        router.push(`/groups/${groupId}/expenses/${expenseId}`)
      }
    />
  );
}
