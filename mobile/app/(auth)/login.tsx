import { useRouter } from "expo-router";

import AuthScreen from "../../src/screens/AuthScreen";

export default function LoginRoute() {
  const router = useRouter();

  return (
    <AuthScreen
      initialMode="login"
      onAuthenticated={() => router.replace("/groups")}
      onSwitchMode={() => router.replace("/signup")}
    />
  );
}
