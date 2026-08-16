import { useLocalSearchParams, useRouter } from "expo-router";

import SettleUpScreen from "../../../../src/screens/SettleUpScreen";

export default function SettleUpRoute() {
  const router = useRouter();
  const { groupId, memberId } = useLocalSearchParams<{
    groupId: string;
    memberId?: string;
  }>();

  return (
    <SettleUpScreen
      groupId={groupId ?? ""}
      memberId={memberId}
      onBack={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
