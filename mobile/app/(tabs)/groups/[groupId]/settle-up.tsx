import { useRouter } from "expo-router";

import SettleUpScreen from "../../../../src/screens/SettleUpScreen";

export default function SettleUpRoute() {
  const router = useRouter();

  return (
    <SettleUpScreen
      onBack={() => router.back()}
      onComplete={() => router.back()}
    />
  );
}
