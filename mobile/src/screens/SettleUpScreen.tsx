import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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

const PERSON = {
  name: "John",
  amountOwed: 600,
};

const RELATED_EXPENSES: RelatedExpense[] = [
  {
    id: "dinner",
    title: "Dinner at Olive",
    date: "Oct 24, 2023",
    amount: 400,
    icon: "restaurant",
  },
  {
    id: "cab",
    title: "Cab to Airport",
    date: "Oct 22, 2023",
    amount: 200,
    icon: "local-taxi",
  },
];

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });

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
  onBack?: () => void;
  onComplete?: () => void;
};

export default function SettleUpScreen({
  onBack,
  onComplete,
}: SettleUpScreenProps) {
  const [amount, setAmount] = useState(String(PERSON.amountOwed));

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
                  {PERSON.name} owes you{" "}
                  <Text style={styles.debtBadgeAmount}>
                    ₹{formatAmount(PERSON.amountOwed)}
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
                {RELATED_EXPENSES.map((expense, index) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    isLast={index === RELATED_EXPENSES.length - 1}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.fixedAction}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm payment received"
              onPress={onComplete}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.confirmButtonPressed,
              ]}
            >
              <Text style={styles.confirmButtonText}>
                CONFIRM PAYMENT RECEIVED
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
