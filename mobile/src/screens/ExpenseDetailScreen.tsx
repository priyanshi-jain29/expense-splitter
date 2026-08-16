import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  surface: "#201F1F",
  surfaceHigh: "#2A2A2A",
  border: "#4D4632",
  text: "#E5E2E1",
  muted: "#D0C6AB",
  outline: "#999077",
  yellow: "#FFD600",
  yellowInk: "#221B00",
  red: "#93000A",
  redText: "#FFDAD6",
};

type SplitType = "equal" | "exact";

type ExpenseShare = {
  userId: string;
  name: string;
  is_placeholder: boolean;
  shareAmount: string;
};

type ExpenseDetail = {
  id: string;
  groupId: string;
  paidBy: string;
  payerName: string;
  amount: string;
  description: string;
  splitType: SplitType;
  createdAt: string;
  shares: ExpenseShare[];
};

const moneyPattern = /^\d+(?:\.\d{0,2})?$/;

const toCents = (value: string) => {
  if (!moneyPattern.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
};

const formatAmount = (value: string | number) =>
  Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Header({
  description,
  isEditing,
  onBack,
  onDescriptionChange,
}: {
  description: string;
  isEditing: boolean;
  onBack?: () => void;
  onDescriptionChange: (value: string) => void;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={onBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.controlPressed,
        ]}
      >
        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
      </Pressable>
      {isEditing ? (
        <TextInput
          accessibilityLabel="Expense description"
          value={description}
          onChangeText={onDescriptionChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={500}
          placeholder="Expense description"
          placeholderTextColor={COLORS.outline}
          selectionColor={COLORS.yellow}
          style={[
            styles.headerTitleInput,
            isFocused && styles.inputShellFocused,
          ]}
        />
      ) : (
        <Text numberOfLines={1} style={styles.headerTitle}>
          {description}
        </Text>
      )}
    </View>
  );
}

function SectionHeading({ children }: { children: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionHeadingText}>{children}</Text>
      <View style={styles.sectionHeadingLine} />
    </View>
  );
}

function Receipt({
  receiptUri,
}: {
  receiptUri: string | null;
}) {
  if (receiptUri) {
    return (
      <View style={styles.receiptPreview}>
        <Image
          accessibilityLabel="Attached receipt"
          source={{ uri: receiptUri }}
          resizeMode="cover"
          style={styles.receiptImage}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => undefined}
          style={({ pressed }) => [
            styles.replaceReceiptButton,
            pressed && styles.controlPressed,
          ]}
        >
          <MaterialIcons name="add-a-photo" size={18} color={COLORS.yellow} />
          <Text style={styles.replaceReceiptText}>Replace Receipt</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add receipt"
      onPress={() => undefined}
      style={({ pressed }) => [
        styles.addReceiptBox,
        pressed && styles.addReceiptPressed,
      ]}
    >
      <View style={styles.cameraCircle}>
        <MaterialIcons name="photo-camera" size={25} color={COLORS.yellow} />
      </View>
      <Text style={styles.addReceiptTitle}>Add Receipt</Text>
      <Text style={styles.addReceiptHint}>Tap to attach a photo</Text>
    </Pressable>
  );
}

function BottomNavigation() {
  return (
    <View style={styles.bottomNavigation}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: false }}
        onPress={() => undefined}
        style={({ pressed }) => [
          styles.navItem,
          pressed && styles.controlPressed,
        ]}
      >
        <MaterialIcons name="groups" size={21} color={COLORS.muted} />
        <Text style={styles.navLabel}>Groups</Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
        onPress={() => undefined}
        style={({ pressed }) => [
          styles.navItem,
          styles.activeNavItem,
          pressed && styles.controlPressed,
        ]}
      >
        <MaterialIcons
          name="receipt-long"
          size={20}
          color={COLORS.yellowInk}
        />
        <Text style={styles.activeNavLabel}>Activity</Text>
      </Pressable>
    </View>
  );
}

type ExpenseDetailScreenProps = {
  expenseId: string;
  onBack?: () => void;
  onDeleted?: () => void;
};

export default function ExpenseDetailScreen({
  expenseId,
  onBack,
  onDeleted,
}: ExpenseDetailScreenProps) {
  const { data: session } = authClient.useSession();
  const [receiptUri] = useState<string | null>(null);
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSplitType, setEditSplitType] = useState<SplitType>("equal");
  const [editShares, setEditShares] = useState<ExpenseShare[]>([]);
  const [focusedShareId, setFocusedShareId] = useState<string | null>(null);

  const requestExpense = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        signal,
        credentials: "include",
      });
      const result = (await response.json().catch(() => null)) as
        | ExpenseDetail
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          result && "error" in result
            ? result.error ?? "Unable to load expense"
            : "Unable to load expense",
        );
      }
      return result as ExpenseDetail;
    },
    [expenseId],
  );

  const applyExpense = (loadedExpense: ExpenseDetail) => {
    setExpense(loadedExpense);
    setEditAmount(loadedExpense.amount);
    setEditDescription(loadedExpense.description);
    setEditSplitType(loadedExpense.splitType);
    setEditShares(loadedExpense.shares);
  };

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadExpense() {
        setIsLoading(true);
        setError(null);
        if (!expenseId) {
          setError("An expense ID is required.");
          setIsLoading(false);
          return;
        }

        try {
          applyExpense(await requestExpense(controller.signal));
          setIsEditing(false);
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError(requestError.message);
          }
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      }

      void loadExpense();
      return () => controller.abort();
    }, [expenseId, requestExpense]),
  );

  const beginEditing = () => {
    if (!expense) return;
    setError(null);
    setEditAmount(expense.amount);
    setEditDescription(expense.description);
    setEditSplitType(expense.splitType);
    setEditShares(expense.shares);
    setIsEditing(true);
  };

  const changeSplitType = (splitType: SplitType) => {
    setEditSplitType(splitType);
    setError(null);
    if (
      splitType === "equal" &&
      expense &&
      !editShares.some((share) => share.userId === expense.paidBy)
    ) {
      setEditShares((current) => [
        ...current,
        {
          userId: expense.paidBy,
          name: expense.payerName,
          is_placeholder: false,
          shareAmount: "0.00",
        },
      ]);
    }
  };

  const updateExactShare = (userId: string, value: string) => {
    setEditShares((current) =>
      current.map((share) =>
        share.userId === userId
          ? { ...share, shareAmount: value.replace(/[^0-9.]/g, "") }
          : share,
      ),
    );
  };

  const saveExpense = async () => {
    if (!expense) return;
    setError(null);
    const amountInCents = toCents(editAmount);
    if (amountInCents === null || amountInCents <= 0) {
      setError("Enter a valid expense amount.");
      return;
    }
    if (!editDescription.trim()) {
      setError("Enter an expense description.");
      return;
    }
    if (editShares.length === 0) {
      setError("The expense must include at least one member.");
      return;
    }

    let members: string[] | Array<{ userId: string; shareAmount: string }> =
      editShares.map((share) => share.userId);
    if (editSplitType === "exact") {
      const shareCents = editShares.map((share) =>
        toCents(share.shareAmount),
      );
      if (shareCents.some((share) => share === null)) {
        setError("Enter a valid exact share for every member.");
        return;
      }
      if (
        shareCents.reduce<number>((sum, share) => sum + (share ?? 0), 0) !==
        amountInCents
      ) {
        setError("Exact shares must add up to the total amount.");
        return;
      }
      members = editShares.map((share) => ({
        userId: share.userId,
        shareAmount: share.shareAmount,
      }));
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: (amountInCents / 100).toFixed(2),
          description: editDescription.trim(),
          splitType: editSplitType,
          members,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to update expense");
      }
      applyExpense(await requestExpense());
      setIsEditing(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update expense. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteExpense = async () => {
    if (!expense) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(result?.error ?? "Unable to delete expense");
      }
      onDeleted?.();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete expense. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const equalShareAmounts = (() => {
    const cents = toCents(editAmount);
    if (cents === null || editShares.length === 0) return [];
    const base = Math.floor(cents / editShares.length);
    const remainder = cents % editShares.length;
    return editShares.map((_, index) =>
      ((base + (index < remainder ? 1 : 0)) / 100).toFixed(2),
    );
  })();

  const shownDescription = isEditing
    ? editDescription
    : expense?.description ?? "Expense";

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea}>
        <Header
          description={shownDescription}
          isEditing={isEditing}
          onBack={onBack}
          onDescriptionChange={setEditDescription}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={COLORS.yellow} size="large" />
              <Text style={styles.loadingText}>Loading expense…</Text>
            </View>
          ) : !expense ? (
            <View style={styles.loadingState}>
              <Text style={styles.errorText}>
                {error ?? "Expense not found."}
              </Text>
            </View>
          ) : (
            <>
          <View style={styles.hero}>
            <View style={styles.categoryIcon}>
              <MaterialIcons
                name="restaurant"
                size={45}
                color={COLORS.yellowInk}
              />
            </View>
            {isEditing ? (
              <View style={styles.editAmountRow}>
                <Text style={styles.amount}>₹</Text>
                <TextInput
                  accessibilityLabel="Expense amount"
                  value={editAmount}
                  onChangeText={(value) =>
                    setEditAmount(value.replace(/[^0-9.]/g, ""))
                  }
                  keyboardType="decimal-pad"
                  selectionColor={COLORS.yellow}
                  style={styles.editAmountInput}
                />
              </View>
            ) : (
              <Text style={styles.amount}>₹{formatAmount(expense.amount)}</Text>
            )}
            <Text style={styles.paidBy}>
              Paid by {expense.paidBy === session?.user.id ? "You" : expense.payerName}
            </Text>
            <Text style={styles.date}>
              {new Date(expense.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).toUpperCase()}
            </Text>
          </View>

          <View style={styles.section}>
            <SectionHeading>SPLIT BREAKDOWN</SectionHeading>
            {isEditing ? (
              <View style={styles.splitTypeToggle}>
                {(["equal", "exact"] as const).map((splitType) => (
                  <Pressable
                    key={splitType}
                    accessibilityRole="button"
                    accessibilityState={{ selected: editSplitType === splitType }}
                    onPress={() => changeSplitType(splitType)}
                    style={[
                      styles.splitTypeButton,
                      editSplitType === splitType && styles.splitTypeButtonSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.splitTypeText,
                        editSplitType === splitType && styles.splitTypeTextSelected,
                      ]}
                    >
                      {splitType === "equal" ? "Equal" : "Exact"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.splitList}>
              {(isEditing ? editShares : expense.shares).map((split, index) => (
                <View
                  key={split.userId}
                  accessibilityLabel={`${split.name}, ₹${formatAmount(split.shareAmount)}`}
                  style={styles.splitRow}
                >
                  <Text style={styles.memberName}>
                    {split.userId === session?.user.id ? "You" : split.name}
                  </Text>
                  {isEditing && editSplitType === "exact" ? (
                    <View
                      style={[
                        styles.shareInputShell,
                        focusedShareId === split.userId &&
                          styles.inputShellFocused,
                      ]}
                    >
                      <Text style={styles.shareCurrency}>₹</Text>
                      <TextInput
                        accessibilityLabel={`${split.name}'s exact share`}
                        value={split.shareAmount}
                        onChangeText={(value) =>
                          updateExactShare(split.userId, value)
                        }
                        onFocus={() => setFocusedShareId(split.userId)}
                        onBlur={() => setFocusedShareId(null)}
                        keyboardType="decimal-pad"
                        selectionColor={COLORS.yellow}
                        style={styles.shareInput}
                      />
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.memberShare,
                        split.userId === session?.user.id && styles.highlightedShare,
                      ]}
                    >
                      ₹{formatAmount(
                        isEditing && editSplitType === "equal"
                          ? equalShareAmounts[index] ?? 0
                          : split.shareAmount,
                      )}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.receiptSection}>
            <SectionHeading>RECEIPT</SectionHeading>
            <Receipt receiptUri={receiptUri} />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving || isDeleting }}
              disabled={isSaving || isDeleting}
              onPress={() =>
                isEditing ? void saveExpense() : beginEditing()
              }
              style={({ pressed }) => [
                styles.actionButton,
                styles.editButton,
                pressed && styles.controlPressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.yellowInk} size="small" />
              ) : (
                <>
                  <MaterialIcons
                    name={isEditing ? "save" : "edit"}
                    size={18}
                    color={COLORS.yellowInk}
                  />
                  <Text style={styles.editButtonText}>
                    {isEditing ? "Save" : "Edit"}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving || isDeleting }}
              disabled={isSaving || isDeleting}
              onPress={() => void deleteExpense()}
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                pressed && styles.controlPressed,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator color={COLORS.redText} size="small" />
              ) : (
                <>
                  <MaterialIcons
                    name="delete-outline"
                    size={19}
                    color={COLORS.redText}
                  />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </>
              )}
            </Pressable>
          </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    width: "100%",
    maxWidth: 390,
  },
  header: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    marginRight: 4,
  },
  headerTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "600",
  },
  headerTitleInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    outlineWidth: 0,
    outlineStyle: "solid",
    outlineColor: "transparent",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  loadingState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  errorText: {
    marginTop: 16,
    color: COLORS.redText,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
  },
  hero: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 38,
  },
  categoryIcon: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.yellow,
    borderRadius: 48,
    marginBottom: 20,
    shadowColor: COLORS.yellow,
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 7,
  },
  amount: {
    color: COLORS.yellow,
    fontSize: 40,
    lineHeight: 47,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  editAmountRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  editAmountInput: {
    minWidth: 110,
    maxWidth: 220,
    height: 52,
    padding: 0,
    color: COLORS.yellow,
    fontSize: 40,
    lineHeight: 47,
    fontWeight: "800",
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: "solid",
    outlineColor: "transparent",
  },
  paidBy: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 3,
  },
  date: {
    color: COLORS.outline,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "600",
    letterSpacing: 1.35,
    marginTop: 1,
  },
  section: { marginTop: 4 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeadingText: {
    color: COLORS.outline,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
    letterSpacing: 1.8,
  },
  sectionHeadingLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    marginLeft: 14,
    backgroundColor: COLORS.border,
  },
  splitTypeToggle: {
    height: 44,
    marginBottom: 12,
    padding: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHigh,
    flexDirection: "row",
    gap: 4,
  },
  splitTypeButton: {
    flex: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  splitTypeButtonSelected: {
    backgroundColor: COLORS.yellow,
  },
  splitTypeText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  splitTypeTextSelected: {
    color: COLORS.yellowInk,
  },
  splitList: { gap: 10 },
  splitRow: {
    minHeight: 57,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(32, 31, 31, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
  },
  splitRowPressed: {
    backgroundColor: COLORS.surfaceHigh,
    transform: [{ scale: 0.98 }],
  },
  memberName: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  memberShare: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  shareInputShell: {
    width: 110,
    height: 38,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.outline,
    borderRadius: 6,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
  },
  shareCurrency: {
    color: COLORS.yellow,
    fontSize: 13,
  },
  shareInput: {
    flex: 1,
    width: 0,
    minWidth: 0,
    height: 36,
    padding: 0,
    color: COLORS.text,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "600",
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: "solid",
    outlineColor: "transparent",
  },
  inputShellFocused: {
    borderColor: COLORS.text,
  },
  highlightedShare: { color: COLORS.yellow },
  receiptSection: { marginTop: 28 },
  addReceiptBox: {
    minHeight: 126,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(32, 31, 31, 0.55)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.outline,
    borderRadius: 12,
  },
  addReceiptPressed: {
    backgroundColor: COLORS.surfaceHigh,
    borderColor: COLORS.yellow,
  },
  cameraCircle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 214, 0, 0.10)",
    borderRadius: 21,
  },
  addReceiptTitle: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  addReceiptHint: {
    color: COLORS.outline,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 1,
  },
  receiptPreview: {
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  receiptImage: { width: "100%", height: 160 },
  replaceReceiptButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  replaceReceiptText: {
    color: COLORS.yellow,
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
  },
  editButton: { backgroundColor: COLORS.yellow },
  deleteButton: { backgroundColor: COLORS.red },
  editButtonText: {
    color: COLORS.yellowInk,
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: COLORS.redText,
    fontSize: 15,
    fontWeight: "600",
  },
  bottomNavigation: {
    minHeight: 80,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  navItem: {
    minWidth: 76,
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  activeNavItem: { backgroundColor: COLORS.yellow },
  navLabel: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    marginTop: 3,
  },
  activeNavLabel: {
    color: COLORS.yellowInk,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    marginTop: 3,
  },
  controlPressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
});
