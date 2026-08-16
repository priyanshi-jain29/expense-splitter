import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";
import { authClient } from "../config/auth-client";

const COLORS = {
  background: "#131313",
  surfaceLowest: "#0E0E0E",
  surfaceLow: "#1C1B1B",
  surface: "#201F1F",
  surfaceHigh: "#2A2A2A",
  surfaceHighest: "#353534",
  border: "#4D4632",
  outline: "#999077",
  text: "#E5E2E1",
  primaryText: "#FFF5DC",
  yellow: "#FFD600",
  yellowInk: "#544600",
};

type RelatedExpense = {
  id: string;
  title: string;
  date: string;
  amount: number;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
};

type MemberBalance = {
  userId: string;
  name: string;
  netAmount: number;
  direction: "owed_to_you" | "you_owe";
};

type ActivityResponse = {
  id: string;
  type: "expense" | "settlement";
  description: string;
  amount: number;
  timestamp: string;
};

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });

function Header({ onBack }: { onBack?: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={onBack}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.controlPressed,
        ]}
      >
        <MaterialIcons name="arrow-back" size={24} color={COLORS.primaryText} />
      </Pressable>
      <Text style={styles.title}>Settle Up</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => undefined}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <MaterialIcons name={icon} size={24} color={COLORS.yellow} />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function ExpenseRow({
  expense,
  isLast,
}: {
  expense: RelatedExpense;
  isLast: boolean;
}) {
  return (
    <View style={[styles.expenseRow, !isLast && styles.expenseRowBorder]}>
      <View style={styles.expenseIcon}>
        <MaterialIcons
          name={expense.icon}
          size={21}
          color={COLORS.primaryText}
        />
      </View>
      <View style={styles.expenseCopy}>
        <Text style={styles.expenseTitle}>{expense.title}</Text>
        <Text style={styles.expenseDate}>{expense.date}</Text>
      </View>
      <Text style={styles.expenseAmount}>+₹{formatAmount(expense.amount)}</Text>
    </View>
  );
}

function BottomNavigation() {
  return (
    <View style={styles.bottomNavigation}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
        onPress={() => undefined}
        style={styles.navItem}
      >
        <MaterialIcons name="groups" size={22} color={COLORS.yellow} />
        <Text style={styles.activeNavLabel}>Groups</Text>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: false }}
        onPress={() => undefined}
        style={styles.navItem}
      >
        <MaterialIcons
          name="notifications-none"
          size={22}
          color={COLORS.outline}
        />
        <Text style={styles.navLabel}>Activity</Text>
      </Pressable>
    </View>
  );
}

type SettleUpScreenProps = {
  groupId: string;
  memberId?: string;
  onBack?: () => void;
  onComplete?: () => void;
};

export default function SettleUpScreen({
  groupId,
  memberId,
  onBack,
  onComplete,
}: SettleUpScreenProps) {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [person, setPerson] = useState<MemberBalance | null>(null);
  const [relatedExpenses, setRelatedExpenses] = useState<RelatedExpense[]>([]);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadSettlementDetails() {
        setIsLoading(true);
        setError(null);

        if (!groupId) {
          setError("A group ID is required.");
          setIsLoading(false);
          return;
        }
        if (isSessionPending) return;
        const userId = session?.user.id;
        if (!userId) {
          setError("Please log in to settle a balance.");
          setIsLoading(false);
          return;
        }

        try {
          const query = new URLSearchParams({ userId });
          const [balancesResponse, activityResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/groups/${groupId}/balances?${query}`, {
              signal: controller.signal,
              credentials: "include",
            }),
            fetch(`${API_BASE_URL}/groups/${groupId}/activity`, {
              signal: controller.signal,
              credentials: "include",
            }),
          ]);
          if (!balancesResponse.ok || !activityResponse.ok) {
            throw new Error("Unable to load settlement details");
          }

          const balances = (await balancesResponse.json()) as MemberBalance[];
          const activity = (await activityResponse.json()) as ActivityResponse[];
          const selectedPerson = memberId
            ? balances.find(
                (balance) =>
                  balance.userId === memberId && balance.netAmount > 0,
              )
            : balances.find((balance) => balance.netAmount > 0);

          if (!selectedPerson) {
            setPerson(null);
            setAmount("");
            setError("No unsettled balance was found for this member.");
          } else {
            setPerson(selectedPerson);
            setAmount(selectedPerson.netAmount.toFixed(2));
          }
          setRelatedExpenses(
            activity
              .filter((item) => item.type === "expense")
              .slice(0, 3)
              .map((item) => ({
                id: item.id,
                title: item.description,
                date: new Date(item.timestamp).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                amount: item.amount,
                icon: "receipt-long",
              })),
          );
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError("Unable to load settlement details. Please try again.");
          }
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      }

      void loadSettlementDetails();
      return () => controller.abort();
    }, [groupId, isSessionPending, memberId, session?.user.id]),
  );

  const handleComplete = async () => {
    setError(null);
    const userId = session?.user.id;
    const settlementAmount = Number(amount);

    if (!userId || !person) {
      setError("Unable to identify both people in this settlement.");
      return;
    }
    if (!Number.isFinite(settlementAmount) || settlementAmount <= 0) {
      setError("Enter a valid settlement amount.");
      return;
    }
    if (settlementAmount > person.netAmount) {
      setError("The settlement cannot exceed the current balance.");
      return;
    }

    const fromUser =
      person.direction === "owed_to_you" ? person.userId : userId;
    const toUser =
      person.direction === "owed_to_you" ? userId : person.userId;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settlements`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          fromUser,
          toUser,
          amount: settlementAmount.toFixed(2),
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to record settlement");
      }
      onComplete?.();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to record settlement. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.contentColumn}
        >
          <Header onBack={onBack} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color={COLORS.yellow} size="large" />
                <Text style={styles.loadingText}>Loading balance…</Text>
              </View>
            ) : person ? (
              <>
            <View style={styles.profileSection}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <MaterialIcons
                    name="person"
                    size={40}
                    color={COLORS.outline}
                  />
                </View>
              </View>

              <View style={styles.debtBadge}>
                <Text style={styles.debtBadgeText}>
                  {person.direction === "owed_to_you"
                    ? `${person.name} owes you `
                    : `You owe ${person.name} `}
                  <Text style={styles.debtBadgeAmount}>
                    ₹{formatAmount(person.netAmount)}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>AMOUNT TO SETTLE</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  accessibilityLabel="Amount to settle"
                  value={amount}
                  onChangeText={(value) =>
                    setAmount(value.replace(/[^0-9.]/g, ""))
                  }
                  keyboardType="decimal-pad"
                  selectionColor={COLORS.yellow}
                  selectTextOnFocus
                  style={styles.amountInput}
                />
              </View>
              <View style={styles.amountUnderline} />
            </View>

            <View style={styles.actions}>
              <ActionButton icon="qr-code-2" label="Show QR" />
              <ActionButton icon="send" label="Remind" />
            </View>

            <View style={styles.relatedSection}>
              <Text style={styles.relatedHeading}>RELATED EXPENSES</Text>
              <View style={styles.expenseCard}>
                {relatedExpenses.length > 0 ? relatedExpenses.map((expense, index) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    isLast={index === relatedExpenses.length - 1}
                  />
                )) : (
                  <Text style={styles.noExpensesText}>No recent expenses.</Text>
                )}
              </View>
            </View>
              </>
            ) : null}
          </ScrollView>

          <View style={styles.fixedAction}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm payment received"
              accessibilityState={{ disabled: isLoading || isSubmitting || !person }}
              disabled={isLoading || isSubmitting || !person}
              onPress={() => void handleComplete()}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.confirmButtonPressed,
                (isLoading || isSubmitting || !person) &&
                  styles.confirmButtonDisabled,
              ]}
            >
              <Text style={styles.confirmButtonText}>
                {isSubmitting
                  ? "RECORDING PAYMENT…"
                  : person?.direction === "you_owe"
                    ? "CONFIRM PAYMENT SENT"
                    : "CONFIRM PAYMENT RECEIVED"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  contentColumn: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  header: {
    height: 64,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceHighest,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.primaryText,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 156,
  },
  profileSection: {
    width: "100%",
    alignItems: "center",
  },
  loadingState: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    rowGap: 12,
  },
  loadingText: {
    color: COLORS.outline,
    fontSize: 12,
  },
  avatarRing: {
    width: 80,
    height: 80,
    padding: 4,
    borderWidth: 2,
    borderColor: COLORS.yellow,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
  },
  avatar: {
    flex: 1,
    borderRadius: 34,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  debtBadge: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceHigh,
  },
  debtBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  debtBadgeAmount: {
    color: COLORS.yellow,
    fontWeight: "700",
  },
  amountSection: {
    width: "100%",
    marginTop: 24,
    alignItems: "center",
  },
  amountLabel: {
    color: COLORS.outline,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 1.25,
  },
  amountRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  currencySymbol: {
    color: COLORS.yellow,
    fontSize: 40,
    lineHeight: 50,
    fontWeight: "800",
  },
  amountInput: {
    minWidth: 84,
    maxWidth: 230,
    height: 58,
    padding: 0,
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 40,
    lineHeight: 50,
    fontWeight: "800",
    letterSpacing: -1,
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: "solid",
    outlineColor: "transparent",
  },
  amountUnderline: {
    width: 64,
    height: 2,
    marginTop: 2,
    borderRadius: 1,
    backgroundColor: COLORS.yellow,
  },
  actions: {
    width: "100%",
    marginTop: 48,
    flexDirection: "row",
    columnGap: 24,
  },
  actionButton: {
    flex: 1,
    minHeight: 88,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    rowGap: 8,
  },
  actionButtonPressed: {
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surfaceHigh,
    transform: [{ scale: 0.97 }],
  },
  actionLabel: {
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  relatedSection: {
    width: "100%",
    marginTop: 20,
    alignItems: "center",
  },
  relatedHeading: {
    marginBottom: 12,
    color: COLORS.outline,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  expenseCard: {
    width: "100%",
    maxWidth: 270,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLow,
  },
  noExpensesText: {
    padding: 20,
    color: COLORS.outline,
    textAlign: "center",
    fontSize: 11,
  },
  expenseRow: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  expenseRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseCopy: {
    flex: 1,
    marginLeft: 12,
  },
  expenseTitle: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  expenseDate: {
    color: COLORS.outline,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  expenseAmount: {
    marginLeft: 8,
    color: COLORS.yellow,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  fixedAction: {
    position: "absolute",
    right: 0,
    bottom: 64,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    zIndex: 3,
  },
  confirmButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  confirmButtonDisabled: {
    opacity: 0.55,
  },
  errorText: {
    marginBottom: 8,
    color: "#FFB4AB",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
  },
  confirmButtonText: {
    color: COLORS.yellowInk,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  bottomNavigation: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 64,
    paddingHorizontal: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 4,
  },
  navItem: {
    minWidth: 72,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNavLabel: {
    color: COLORS.yellow,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  navLabel: {
    color: COLORS.outline,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  controlPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
