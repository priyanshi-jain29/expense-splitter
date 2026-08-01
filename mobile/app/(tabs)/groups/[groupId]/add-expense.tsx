import { useRouter } from "expo-router";

import AddExpenseScreen from "../../../../src/screens/AddExpenseScreen";

export default function AddExpenseRoute() {
  const router = useRouter();

  return (
    <AddExpenseScreen
      onBack={() => router.back()}
      onSave={() => router.back()}
    />
  );
}
