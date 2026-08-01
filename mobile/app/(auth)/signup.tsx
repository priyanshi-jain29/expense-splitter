import { useRouter } from "expo-router";

import AuthScreen from "../../src/screens/AuthScreen";

export default function SignupRoute() {
  const router = useRouter();

  return (
    <AuthScreen
      initialMode="signup"
      onAuthenticated={() => router.replace("/groups")}
      onSwitchMode={() => router.replace("/login")}
    />
  );
}
