import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

type ExpenseBreakdown = {
  purpose: string;
  amount: number;
};

type MemberBalance = {
  userId: string;
  name: string;
  netAmount: number;
  direction: "owed_to_you" | "you_owe";
  expenses: ExpenseBreakdown[];
};

const MY_BALANCES: MemberBalance[] = [
  {
    userId: "john",
    name: "John",
    netAmount: 600,
    direction: "owed_to_you",
    expenses: [
      { purpose: "Scuba Diving", amount: 1200 },
      { purpose: "Petrol", amount: -600 },
    ],
  },
  {
    userId: "priya",
    name: "Priya",
    netAmount: 400,
    direction: "you_owe",
    expenses: [
      { purpose: "Beach Shack", amount: 450 },
      { purpose: "Dinner", amount: -850 },
    ],
  },
  {
    userId: "arjun",
    name: "Arjun",
    netAmount: 250,
    direction: "owed_to_you",
    expenses: [
      { purpose: "Airport Cab", amount: 500 },
      { purpose: "Snacks", amount: -250 },
    ],
  },
];

const rupees = (amount: number) =>
  Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 });

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
        Trip to Goa
      </Text>

      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search group"
          hitSlop={10}
          onPress={() => undefined}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="search" size={22} color={COLORS.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={10}
          onPress={onAddMembers}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="more-vert" size={22} color={COLORS.muted} />
        </Pressable>
      </View>
    </View>
  );
}

function BalanceRow({
  member,
  onOpenExpense,
  onSettleUp,
}: {
  member: MemberBalance;
  onOpenExpense?: (expenseId: string) => void;
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

      <View style={styles.breakdown}>
        {member.expenses.map((expense) => (
          <Pressable
            key={expense.purpose}
            accessibilityRole="button"
            accessibilityLabel={`Open ${expense.purpose} expense`}
            onPress={() =>
              onOpenExpense?.(
                expense.purpose.toLowerCase().replace(/\s+/g, "-"),
              )
            }
            style={styles.expenseRow}
          >
            <Text style={styles.expensePurpose}>{expense.purpose}</Text>
            <Text
              style={[
                styles.expenseAmount,
                expense.amount > 0 ? styles.positive : styles.negative,
              ]}
            >
              {expense.amount > 0 ? "+" : "-"}₹{rupees(expense.amount)}
            </Text>
          </Pressable>
        ))}
      </View>
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
  onBack?: () => void;
  onAddMembers?: () => void;
  onAddExpense?: () => void;
  onOpenExpense?: (expenseId: string) => void;
  onSettleUp?: () => void;
};

export default function GroupDetailsScreen({
  onBack,
  onAddMembers,
  onAddExpense,
  onOpenExpense,
  onSettleUp,
}: GroupDetailsScreenProps) {
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
            <View style={styles.balanceList}>
              {MY_BALANCES.map((member) => (
                <BalanceRow
                  key={member.userId}
                  member={member}
                  onOpenExpense={onOpenExpense}
                  onSettleUp={onSettleUp}
                />
              ))}
            </View>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
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
  breakdown: {
    marginTop: 8,
    paddingTop: 10,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(77, 70, 50, 0.42)",
    rowGap: 4,
  },
  expenseRow: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 12,
  },
  expensePurpose: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  expenseAmount: {
    textAlign: "right",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
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
