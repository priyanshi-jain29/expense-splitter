import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
};

const MEMBERS: Member[] = [
  { id: "you", name: "You", role: "Host", isHost: true },
  { id: "john", name: "John", role: "Group Member" },
  { id: "priya", name: "Priya", role: "Group Member" },
];

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
  onToggle,
}: {
  member: Member;
  selected: boolean;
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
  onBack?: () => void;
  onSave?: () => void;
};

export default function AddExpenseScreen({
  onBack,
  onSave,
}: AddExpenseScreenProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleMember = (memberId: string) => {
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
    setSelectedMemberIds((current) =>
      current.size === MEMBERS.length
        ? new Set()
        : new Set(MEMBERS.map((member) => member.id)),
    );
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
                  onChangeText={setAmount}
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

            <SplitToggle value={splitMethod} onChange={setSplitMethod} />

            <View style={styles.memberHeader}>
              <Text style={styles.memberHeading}>Split with:</Text>
              <Pressable
                accessibilityRole="button"
                onPress={toggleAllMembers}
                hitSlop={10}
                style={({ pressed }) => pressed && styles.controlPressed}
              >
                <Text style={styles.selectAll}>
                  {selectedMemberIds.size === MEMBERS.length
                    ? "Clear All"
                    : "Select All"}
                </Text>
              </Pressable>
            </View>

            <FlatList
              data={MEMBERS}
              keyExtractor={(member) => member.id}
              renderItem={({ item }) => (
                <MemberCard
                  member={item}
                  selected={selectedMemberIds.has(item.id)}
                  onToggle={() => toggleMember(item.id)}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.memberGap} />}
              contentContainerStyle={styles.memberListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.memberList}
            />
          </View>

          <View style={styles.fixedAction}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save expense"
              onPress={onSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
              ]}
            >
              <MaterialIcons name="save" size={20} color={COLORS.yellowInk} />
              <Text style={styles.saveButtonText}>Save Expense</Text>
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
