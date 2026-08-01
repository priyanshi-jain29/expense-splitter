import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
  surface: "#201F1F",
  surfaceHigh: "#2A2A2A",
  surfaceHighest: "#353534",
  border: "#4D4632",
  text: "#E5E2E1",
  muted: "#D0C6AB",
  mutedDark: "#817C6E",
  yellow: "#FFD600",
  yellowDim: "#E9C400",
  yellowInk: "#3A3000",
  avatar: "#474746",
};

type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

type Member = {
  id: string;
  name: string;
  status: "Registered" | "Pending";
};

const USERS: RegisteredUser[] = [
  {
    id: "john",
    name: "John Doe",
    email: "john.doe@example.com",
    initials: "JD",
  },
  {
    id: "ananya",
    name: "Ananya Shah",
    email: "ananya.shah@example.com",
    initials: "AS",
  },
  {
    id: "michael",
    name: "Michael Chen",
    email: "michael.chen@example.com",
    initials: "MC",
  },
];

const INITIAL_MEMBERS: Member[] = [
  { id: "priya", name: "Priya", status: "Registered" },
  { id: "rahul", name: "Rahul", status: "Pending" },
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
          pressed && styles.pressed,
        ]}
      >
        <MaterialIcons name="arrow-back" size={23} color={COLORS.text} />
      </Pressable>
      <Text style={styles.title}>Add Members</Text>
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
        <MaterialIcons name="groups" size={22} color={COLORS.yellowDim} />
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
          color={COLORS.mutedDark}
        />
        <Text style={styles.navLabel}>Activity</Text>
      </Pressable>
    </View>
  );
}

type AddMembersScreenProps = {
  onBack?: () => void;
  onDone?: () => void;
};

export default function AddMembersScreen({
  onBack,
  onDone,
}: AddMembersScreenProps) {
  const [query, setQuery] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return USERS;
    return USERS.filter(
      (user) =>
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized),
    );
  }, [query]);

  const addRegisteredUser = (user: RegisteredUser) => {
    if (members.some((member) => member.id === user.id)) return;
    setMembers((current) => [
      ...current,
      { id: user.id, name: user.name, status: "Registered" },
    ]);
  };

  const addPlaceholderMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    setMembers((current) => [
      ...current,
      { id: `pending-${Date.now()}`, name, status: "Pending" },
    ]);
    setNewMemberName("");
  };

  const renderResult = ({ item }: { item: RegisteredUser }) => {
    const alreadyAdded = members.some((member) => member.id === item.id);
    return (
      <View style={styles.resultCard}>
        <View style={styles.personInfo}>
          <View style={styles.resultAvatar}>
            <Text style={styles.resultAvatarText}>{item.initials}</Text>
          </View>
          <View style={styles.personCopy}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name}`}
          disabled={alreadyAdded}
          onPress={() => addRegisteredUser(item)}
          style={({ pressed }) => [
            styles.addButton,
            alreadyAdded && styles.addButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addButtonText}>
            {alreadyAdded ? "Added" : "Add"}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <Header onBack={onBack} />
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderResult}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.resultGap} />}
            contentContainerStyle={styles.content}
            ListHeaderComponent={
              <>
                <View style={styles.searchBox}>
                  <MaterialIcons
                    name="search"
                    size={21}
                    color={COLORS.muted}
                  />
                  <TextInput
                    accessibilityLabel="Search by name or email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={setQuery}
                    placeholder="Search by name or email"
                    placeholderTextColor={COLORS.muted}
                    style={styles.searchInput}
                    value={query}
                  />
                </View>
                <Text style={styles.sectionLabel}>SEARCH RESULTS</Text>
              </>
            }
            ListEmptyComponent={
              <Text style={styles.emptyResult}>No registered users match.</Text>
            }
            ListFooterComponent={
              <>
                <Text style={[styles.sectionLabel, styles.fallbackLabel]}>
                  NO USER FOUND — ADD AS A NEW MEMBER
                </Text>
                <View style={styles.placeholderCard}>
                  <Text style={styles.fieldLabel}>Full Name</Text>
                  <TextInput
                    accessibilityLabel="Full name"
                    onChangeText={setNewMemberName}
                    onSubmitEditing={addPlaceholderMember}
                    placeholder="Enter name"
                    placeholderTextColor={COLORS.muted}
                    returnKeyType="done"
                    style={styles.nameInput}
                    value={newMemberName}
                  />
                  <Pressable
                    accessibilityRole="button"
                    disabled={!newMemberName.trim()}
                    onPress={addPlaceholderMember}
                    style={({ pressed }) => [
                      styles.addMemberButton,
                      !newMemberName.trim() && styles.buttonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialIcons
                      name="person-add-alt"
                      size={19}
                      color={COLORS.yellowInk}
                    />
                    <Text style={styles.addMemberButtonText}>
                      {newMemberName.trim()
                        ? `Add ${newMemberName.trim()} as Member`
                        : "Add as Member"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.memberHeading}>
                  <Text style={styles.sectionLabel}>ADDED MEMBERS</Text>
                  <Text style={styles.totalBadge}>{members.length} total</Text>
                </View>
                {members.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberIdentity}>
                      <View
                        style={[
                          styles.memberAvatar,
                          member.status === "Pending" &&
                            styles.pendingMemberAvatar,
                        ]}
                      >
                        <Text
                          style={[
                            styles.memberInitial,
                            member.status === "Pending" &&
                              styles.pendingMemberInitial,
                          ]}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.memberName}>{member.name}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        member.status === "Pending" &&
                          styles.pendingStatusBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          member.status === "Pending" &&
                            styles.pendingStatusText,
                        ]}
                      >
                        {member.status}
                      </Text>
                    </View>
                  </View>
                ))}
                <Pressable
                  accessibilityRole="button"
                  onPress={onDone}
                  style={({ pressed }) => [
                    styles.doneButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </>
            }
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    height: 58,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceHighest,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  title: {
    color: COLORS.yellowDim,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 24 },
  searchBox: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceHighest,
    borderWidth: 1,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  sectionLabel: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.55,
    marginTop: 34,
    marginBottom: 12,
  },
  resultCard: {
    minHeight: 72,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighest,
    borderRadius: 12,
  },
  personInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#32302B",
    borderWidth: 1,
    borderColor: COLORS.surfaceHighest,
  },
  resultAvatarText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  personCopy: { flex: 1, paddingRight: 8 },
  personName: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  personEmail: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  addButton: {
    minWidth: 66,
    height: 34,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.yellow,
    borderRadius: 18,
  },
  addButtonDisabled: { opacity: 0.48 },
  addButtonText: { color: COLORS.yellowInk, fontSize: 12, fontWeight: "700" },
  resultGap: { height: 8 },
  emptyResult: { color: COLORS.mutedDark, fontSize: 13, paddingVertical: 12 },
  fallbackLabel: { marginTop: 34 },
  placeholderCard: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.surfaceHighest,
    borderRadius: 12,
  },
  fieldLabel: { color: COLORS.muted, fontSize: 10, marginBottom: 8 },
  nameInput: {
    height: 43,
    paddingHorizontal: 12,
    color: COLORS.text,
    fontSize: 13,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.surfaceHighest,
    borderRadius: 6,
  },
  addMemberButton: {
    minHeight: 44,
    marginTop: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.yellow,
    borderRadius: 8,
  },
  addMemberButtonText: {
    flexShrink: 1,
    color: COLORS.yellowInk,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  buttonDisabled: { opacity: 0.62 },
  memberHeading: {
    marginTop: 34,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalBadge: {
    overflow: "hidden",
    color: COLORS.muted,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 4,
  },
  memberRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceHighest,
  },
  memberIdentity: { flexDirection: "row", alignItems: "center", gap: 12 },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.yellow,
  },
  pendingMemberAvatar: { backgroundColor: COLORS.avatar },
  memberInitial: { color: COLORS.yellowInk, fontSize: 12, fontWeight: "700" },
  pendingMemberInitial: { color: COLORS.text },
  memberName: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
  },
  pendingStatusBadge: { backgroundColor: COLORS.surfaceHighest },
  statusText: { color: COLORS.yellowInk, fontSize: 9, fontWeight: "700" },
  pendingStatusText: { color: COLORS.muted },
  doneButton: {
    height: 54,
    marginTop: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
  },
  doneButtonText: { color: COLORS.yellowInk, fontSize: 20, fontWeight: "800" },
  bottomNavigation: {
    height: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceHighest,
  },
  navItem: {
    minWidth: 88,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNavLabel: { color: COLORS.yellowDim, fontSize: 10, marginTop: 2 },
  navLabel: { color: COLORS.mutedDark, fontSize: 10, marginTop: 2 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
