import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";
import { authClient } from "../config/auth-client";

const COLORS = {
  background: "#131313",
  navigation: "#201F1F",
  border: "#4D4632",
  text: "#E5E2E1",
  muted: "#D0C6AB",
  yellow: "#FFD600",
  yellowInk: "#3A3000",
  success: "#6DD58C",
  error: "#FFB4AB",
};

type MemberBalance = {
  userId: string;
  name: string;
  netAmount: number;
  direction: "owed_to_you" | "you_owe";
};

const rupees = (amount: number) =>
  Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 2 });

function Header({
  onBack,
  onAddMembers,
}: {
  onBack?: () => void;
  onAddMembers?: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={onBack}
        style={({ pressed }) => [
          styles.headerButton,
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
      </Pressable>

      <Text numberOfLines={1} style={styles.groupName}>
        Group Details
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add members"
        hitSlop={10}
        onPress={onAddMembers}
        style={({ pressed }) => [
          styles.addMembersButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.addMembersLabel}>Add members</Text>
      </Pressable>
    </View>
  );
}

function BalanceRow({
  member,
  onSettleUp,
}: {
  member: MemberBalance;
  onSettleUp?: () => void;
}) {
  const isOwed = member.direction === "owed_to_you";

  return (
    <View style={styles.memberBlock}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Settle balance with ${member.name}`}
        onPress={onSettleUp}
        style={styles.netRow}
      >
        <Text style={styles.memberName}>{member.name}</Text>
        <Text
          style={[styles.netBalance, isOwed ? styles.positive : styles.negative]}
        >
          {isOwed ? `${member.name} owes you` : `You owe ${member.name}`} ₹
          {rupees(member.netAmount)}
        </Text>
      </Pressable>
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
        style={styles.activeNavItem}
      >
        <MaterialIcons name="groups" size={22} color={COLORS.yellowInk} />
        <Text style={styles.activeNavLabel}>Groups</Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: false }}
        onPress={() => undefined}
        style={styles.navItem}
      >
        <MaterialIcons name="receipt-long" size={22} color={COLORS.muted} />
        <Text style={styles.navLabel}>Activity</Text>
      </Pressable>
    </View>
  );
}

type GroupDetailsScreenProps = {
  groupId: string;
  onBack?: () => void;
  onAddMembers?: () => void;
  onAddExpense?: () => void;
  onSettleUp?: () => void;
};

export default function GroupDetailsScreen({
  groupId,
  onBack,
  onAddMembers,
  onAddExpense,
  onSettleUp,
}: GroupDetailsScreenProps) {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadBalances() {
        setIsLoading(true);
        setError(null);

        if (!groupId) {
          setBalances([]);
          setError("A group ID is required to load balances.");
          setIsLoading(false);
          return;
        }
        if (isSessionPending) return;
        const userId = session?.user.id;
        if (!userId) {
          setBalances([]);
          setError("Please log in to view group balances.");
          setIsLoading(false);
          return;
        }

        try {
          const query = new URLSearchParams({ userId });
          const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/balances?${query}`,
            {
              signal: controller.signal,
              credentials: "include",
            },
          );
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const data = (await response.json()) as MemberBalance[];
          setBalances(data);
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError("Unable to load balances. Please try again.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      }

      void loadBalances();
      return () => controller.abort();
    }, [groupId, isSessionPending, session?.user.id]),
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentColumn}>
          <Header onBack={onBack} onAddMembers={onAddMembers} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Balances</Text>
            {isLoading ? (
              <View style={styles.statusState}>
                <ActivityIndicator color={COLORS.yellow} size="large" />
                <Text style={styles.statusText}>Loading balances…</Text>
              </View>
            ) : error ? (
              <Text style={[styles.statusState, styles.errorText]}>{error}</Text>
            ) : balances.length === 0 ? (
              <Text style={styles.statusState}>All settled up.</Text>
            ) : (
              <View style={styles.balanceList}>
                {balances.map((member) => (
                  <BalanceRow
                    key={member.userId}
                    member={member}
                    onSettleUp={onSettleUp}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add expense"
            onPress={onAddExpense}
            style={({ pressed }) => [
              styles.floatingButton,
              pressed && styles.floatingButtonPressed,
            ]}
          >
            <MaterialIcons name="add" size={22} color={COLORS.yellowInk} />
            <Text style={styles.floatingButtonLabel}>ADD EXPENSE</Text>
          </Pressable>
        </View>
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
    borderBottomColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.94 }],
  },
  groupName: {
    flex: 1,
    marginLeft: 0,
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  addMembersButton: {
    minHeight: 44,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addMembersLabel: {
    color: COLORS.yellow,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 180,
  },
  sectionTitle: {
    paddingHorizontal: 4,
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  balanceList: {
    marginTop: 24,
    rowGap: 40,
  },
  statusState: {
    minHeight: 180,
    marginTop: 16,
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 12,
  },
  statusText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.error,
  },
  memberBlock: {
    width: "100%",
  },
  netRow: {
    minHeight: 26,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
  },
  memberName: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  netBalance: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  positive: {
    color: COLORS.success,
  },
  negative: {
    color: COLORS.error,
  },
  floatingButton: {
    position: "absolute",
    right: 16,
    bottom: 96,
    minHeight: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: COLORS.yellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 4,
  },
  floatingButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.92 }],
  },
  floatingButtonLabel: {
    color: COLORS.yellowInk,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  bottomNavigation: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 80,
    paddingHorizontal: 36,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.navigation,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    zIndex: 3,
  },
  activeNavItem: {
    minWidth: 76,
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 26,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNavLabel: {
    color: COLORS.yellowInk,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  navItem: {
    minWidth: 76,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
});
