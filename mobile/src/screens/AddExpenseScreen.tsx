import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
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
  surfaceLow: "#1C1B1B",
  surface: "#201F1F",
  surfaceHigh: "#2A2A2A",
  avatar: "#474746",
  border: "#4D4632",
  outline: "#999077",
  text: "#E5E2E1",
  primaryText: "#FFF5DC",
  muted: "#D0C6AB",
  secondary: "#C8C6C5",
  yellow: "#FFD600",
  yellowInk: "#221B00",
};

type SplitMethod = "equal" | "exact" | null;

type Member = {
  id: string;
  name: string;
  role: string;
  isHost?: boolean;
  is_placeholder: boolean;
};

const moneyPattern = /^\d+(?:\.\d{0,2})?$/;

const toCents = (value: string) => {
  if (!moneyPattern.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
};

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
      <Text style={styles.title}>Add Expense</Text>
    </View>
  );
}

function SplitToggle({
  value,
  onChange,
}: {
  value: SplitMethod;
  onChange: (method: Exclude<SplitMethod, null>) => void;
}) {
  return (
    <View style={styles.splitSection}>
      <Text style={styles.fieldLabel}>Split Method</Text>
      <View style={styles.splitToggle}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === "equal" }}
          onPress={() => onChange("equal")}
          style={({ pressed }) => [
            styles.splitOption,
            value === "equal" && styles.splitOptionSelected,
            pressed && styles.controlPressed,
          ]}
        >
          <Text
            style={[
              styles.splitOptionText,
              value === "equal" && styles.splitOptionTextSelected,
            ]}
          >
            Split Equally
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: value === "exact" }}
          onPress={() => onChange("exact")}
          style={({ pressed }) => [
            styles.splitOption,
            value === "exact" && styles.splitOptionSelected,
            pressed && styles.controlPressed,
          ]}
        >
          <Text
            style={[
              styles.splitOptionText,
              value === "exact" && styles.splitOptionTextSelected,
            ]}
          >
            Split by Exact Amount
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MemberCard({
  member,
  selected,
  exactAmount,
  showExactAmount,
  onExactAmountChange,
  onToggle,
}: {
  member: Member;
  selected: boolean;
  exactAmount: string;
  showExactAmount: boolean;
  onExactAmountChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${member.name}, ${member.role}`}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.memberCard,
        pressed && styles.memberCardPressed,
      ]}
    >
      <View
        style={[
          styles.avatar,
          member.isHost ? styles.hostAvatar : styles.memberAvatar,
        ]}
      >
        <MaterialIcons
          name="person"
          size={22}
          color={member.isHost ? COLORS.yellow : COLORS.secondary}
        />
      </View>

      <View style={styles.memberCopy}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRole}>{member.role}</Text>
      </View>

      {showExactAmount ? (
        <View style={styles.exactAmountShell}>
          <Text style={styles.exactCurrency}>₹</Text>
          <TextInput
            accessibilityLabel={`${member.name}'s exact share`}
            value={exactAmount}
            onChangeText={(value) =>
              onExactAmountChange(value.replace(/[^0-9.]/g, ""))
            }
            onPressIn={(event) => event.stopPropagation()}
            placeholder="0.00"
            placeholderTextColor={COLORS.outline}
            keyboardType="decimal-pad"
            selectionColor={COLORS.yellow}
            style={styles.exactAmountInput}
          />
        </View>
      ) : null}

      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && (
          <MaterialIcons name="check" size={17} color={COLORS.yellowInk} />
        )}
      </View>
    </Pressable>
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
          color={COLORS.secondary}
        />
        <Text style={styles.navLabel}>Activity</Text>
      </Pressable>
    </View>
  );
}

type AddExpenseScreenProps = {
  groupId: string;
  onBack?: () => void;
  onSave?: () => void;
};

export default function AddExpenseScreen({
  groupId,
  onBack,
  onSave,
}: AddExpenseScreenProps) {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadMembers() {
        setIsLoadingMembers(true);
        setError(null);

        if (!groupId) {
          setError("A group ID is required to load members.");
          setIsLoadingMembers(false);
          return;
        }
        if (isSessionPending) return;
        const userId = session?.user.id;
        if (!userId) {
          setError("Please log in to add an expense.");
          setIsLoadingMembers(false);
          return;
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/members`,
            { signal: controller.signal, credentials: "include" },
          );
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const data = (await response.json()) as Array<{
            id: string;
            name: string;
            is_placeholder: boolean;
          }>;
          const loadedMembers = data.map((member) => ({
            ...member,
            name: member.id === userId ? "You" : member.name,
            role:
              member.id === userId
                ? "Payer"
                : member.is_placeholder
                  ? "Placeholder Member"
                  : "Group Member",
            isHost: member.id === userId,
          }));
          setMembers(loadedMembers);
          setSelectedMemberIds(
            new Set(loadedMembers.map((member) => member.id)),
          );
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError("Unable to load group members. Please try again.");
          }
        } finally {
          if (!controller.signal.aborted) setIsLoadingMembers(false);
        }
      }

      void loadMembers();
      return () => controller.abort();
    }, [groupId, isSessionPending, session?.user.id]),
  );

  const toggleMember = (memberId: string) => {
    if (
      splitMethod === "equal" &&
      memberId === session?.user.id &&
      selectedMemberIds.has(memberId)
    ) {
      setError("The payer must stay included in an equal split.");
      return;
    }
    setError(null);
    setSelectedMemberIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const toggleAllMembers = () => {
    setError(null);
    setSelectedMemberIds((current) => {
      if (current.size !== members.length) {
        return new Set(members.map((member) => member.id));
      }
      return splitMethod === "equal" && session?.user.id
        ? new Set([session.user.id])
        : new Set();
    });
  };

  const changeSplitMethod = (method: Exclude<SplitMethod, null>) => {
    setError(null);
    setSplitMethod(method);
    if (method === "equal" && session?.user.id) {
      setSelectedMemberIds((current) =>
        new Set([...current, session.user.id]),
      );
    }
  };

  const handleSave = async () => {
    setError(null);
    const userId = session?.user.id;
    const amountInCents = toCents(amount);

    if (!userId) {
      setError("Please log in to save an expense.");
      return;
    }
    if (!groupId || amountInCents === null || amountInCents <= 0) {
      setError("Enter a valid expense amount.");
      return;
    }
    if (!description.trim()) {
      setError("Enter a description for the expense.");
      return;
    }
    if (!splitMethod) {
      setError("Choose an equal or exact split.");
      return;
    }
    const participantIds = [...selectedMemberIds];
    if (participantIds.length === 0) {
      setError("Select at least one member.");
      return;
    }
    if (splitMethod === "equal" && !selectedMemberIds.has(userId)) {
      setError("The payer must be included in the split.");
      return;
    }

    let splitMembers: string[] | Array<{ userId: string; shareAmount: string }> =
      participantIds;
    if (splitMethod === "exact") {
      const shares = participantIds.map((memberId) => ({
        userId: memberId,
        shareAmount: exactAmounts[memberId]?.trim() ?? "",
      }));
      const shareCents = shares.map((share) => toCents(share.shareAmount));
      if (shareCents.some((share) => share === null)) {
        setError("Enter a valid exact share for every selected member.");
        return;
      }
      if (shareCents.reduce<number>((sum, share) => sum + (share ?? 0), 0) !== amountInCents) {
        setError("Exact shares must add up to the total amount.");
        return;
      }
      splitMembers = shares;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          paidBy: userId,
          amount: (amountInCents / 100).toFixed(2),
          description: description.trim(),
          splitType: splitMethod,
          members: splitMembers,
        }),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "Unable to save expense");
      }
      onSave?.();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save expense. Please try again.",
      );
    } finally {
      setIsSaving(false);
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

          <View style={styles.form}>
            <View style={styles.amountSection}>
              <Text style={styles.amountLabel}>Amount</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  accessibilityLabel="Expense amount"
                  value={amount}
                  onChangeText={(value) =>
                    setAmount(value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="0.00"
                  placeholderTextColor={COLORS.yellow}
                  keyboardType="decimal-pad"
                  selectionColor={COLORS.yellow}
                  style={styles.amountInput}
                />
              </View>
            </View>

            <View style={styles.descriptionShell}>
              <MaterialIcons
                name="description"
                size={21}
                color={COLORS.outline}
              />
              <TextInput
                accessibilityLabel="Expense description, required"
                value={description}
                onChangeText={setDescription}
                placeholder="What was this for? *"
                placeholderTextColor={COLORS.outline}
                selectionColor={COLORS.yellow}
                returnKeyType="done"
                style={styles.descriptionInput}
              />
            </View>

            <SplitToggle value={splitMethod} onChange={changeSplitMethod} />

            <View style={styles.memberHeader}>
              <Text style={styles.memberHeading}>Split with:</Text>
              <Pressable
                accessibilityRole="button"
                onPress={toggleAllMembers}
                hitSlop={10}
                style={({ pressed }) => pressed && styles.controlPressed}
              >
                <Text style={styles.selectAll}>
                  {members.length > 0 && selectedMemberIds.size === members.length
                    ? "Clear All"
                    : "Select All"}
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={members}
              keyExtractor={(member) => member.id}
              renderItem={({ item }) => (
                <MemberCard
                  member={item}
                  selected={selectedMemberIds.has(item.id)}
                  showExactAmount={
                    splitMethod === "exact" && selectedMemberIds.has(item.id)
                  }
                  exactAmount={exactAmounts[item.id] ?? ""}
                  onExactAmountChange={(value) =>
                    setExactAmounts((current) => ({
                      ...current,
                      [item.id]: value,
                    }))
                  }
                  onToggle={() => toggleMember(item.id)}
                />
              )}
              ListEmptyComponent={
                <View style={styles.memberLoadingState}>
                  {isLoadingMembers ? (
                    <ActivityIndicator color={COLORS.yellow} size="large" />
                  ) : (
                    <Text style={styles.memberLoadingText}>
                      No members found in this group.
                    </Text>
                  )}
                </View>
              }
              ItemSeparatorComponent={() => <View style={styles.memberGap} />}
              contentContainerStyle={styles.memberListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.memberList}
            />
          </View>

          <View style={styles.fixedAction}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save expense"
              accessibilityState={{ disabled: isSaving || isLoadingMembers }}
              disabled={isSaving || isLoadingMembers}
              onPress={() => void handleSave()}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                (isSaving || isLoadingMembers) && styles.saveButtonDisabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={COLORS.yellowInk} size="small" />
              ) : (
                <>
                  <MaterialIcons name="save" size={20} color={COLORS.yellowInk} />
                  <Text style={styles.saveButtonText}>Save Expense</Text>
                </>
              )}
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
    marginLeft: 0,
    color: COLORS.primaryText,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.35,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 148,
  },
  amountSection: {
    alignItems: "center",
    paddingVertical: 12,
  },
  amountLabel: {
    marginBottom: 5,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  amountRow: {
    width: "100%",
    height: 54,
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    color: COLORS.yellow,
    fontSize: 34,
    lineHeight: 45,
    fontWeight: "800",
  },
  amountInput: {
    flex: 1,
    height: 54,
    padding: 0,
    paddingRight: 28,
    color: COLORS.yellow,
    textAlign: "center",
    fontSize: 34,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  descriptionShell: {
    height: 54,
    marginTop: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLow,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  descriptionInput: {
    flex: 1,
    height: "100%",
    padding: 0,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  splitSection: {
    marginTop: 16,
  },
  fieldLabel: {
    marginBottom: 12,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  splitToggle: {
    height: 56,
    padding: 4,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHigh,
    flexDirection: "row",
    columnGap: 4,
  },
  splitOption: {
    flex: 1,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  splitOptionSelected: {
    backgroundColor: COLORS.yellow,
  },
  splitOptionText: {
    color: COLORS.secondary,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  splitOptionTextSelected: {
    color: COLORS.yellowInk,
    fontWeight: "700",
  },
  memberHeader: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberHeading: {
    color: COLORS.primaryText,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  selectAll: {
    color: COLORS.yellow,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  memberList: {
    flex: 1,
  },
  memberListContent: {
    paddingBottom: 12,
  },
  memberCard: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  memberCardPressed: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceHigh,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  hostAvatar: {
    borderWidth: 1,
    borderColor: "rgba(255, 214, 0, 0.30)",
    backgroundColor: "rgba(255, 214, 0, 0.14)",
  },
  memberAvatar: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.avatar,
  },
  memberCopy: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  memberRole: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.outline,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    borderColor: COLORS.yellow,
    backgroundColor: COLORS.yellow,
  },
  exactAmountShell: {
    width: 94,
    height: 38,
    marginRight: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  exactCurrency: {
    color: COLORS.yellow,
    fontSize: 12,
  },
  exactAmountInput: {
    flex: 1,
    height: 36,
    padding: 0,
    color: COLORS.text,
    textAlign: "right",
    fontSize: 12,
  },
  memberLoadingState: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  memberLoadingText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  memberGap: {
    height: 12,
  },
  fixedAction: {
    position: "absolute",
    right: 0,
    bottom: 64,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    zIndex: 3,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.yellow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 9,
    elevation: 8,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    marginBottom: 8,
    color: "#FFB4AB",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
  },
  saveButtonText: {
    color: COLORS.yellowInk,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
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
    backgroundColor: COLORS.surfaceLow,
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
    fontWeight: "700",
  },
  navLabel: {
    color: COLORS.secondary,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  controlPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});
