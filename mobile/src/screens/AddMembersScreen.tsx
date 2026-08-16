import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  email: string | null;
};

type Member = {
  id: string;
  name: string;
  is_placeholder: boolean;
  status: "Registered" | "Pending";
};

type ApiMember = Pick<Member, "id" | "name" | "is_placeholder">;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

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
  groupId: string;
  onBack?: () => void;
  onDone?: () => void;
};

export default function AddMembersScreen({
  groupId,
  onBack,
  onDone,
}: AddMembersScreenProps) {
  const [query, setQuery] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [results, setResults] = useState<RegisteredUser[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [isAddingPlaceholder, setIsAddingPlaceholder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadMembers() {
        setIsLoadingMembers(true);
        setError(null);
        try {
          const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/members`,
            { signal: controller.signal, credentials: "include" },
          );
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const data = (await response.json()) as ApiMember[];
          setMembers(
            data.map((member) => ({
              ...member,
              status: member.is_placeholder ? "Pending" : "Registered",
            })),
          );
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError("Unable to load group members.");
          }
        } finally {
          if (!controller.signal.aborted) setIsLoadingMembers(false);
        }
      }

      void loadMembers();
      return () => controller.abort();
    }, [groupId]),
  );

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      async function searchUsers() {
        setIsSearching(true);
        setError(null);
        try {
          const search = new URLSearchParams({ query: normalizedQuery });
          const response = await fetch(`${API_BASE_URL}/users/search?${search}`, {
            signal: controller.signal,
            credentials: "include",
          });
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          setResults((await response.json()) as RegisteredUser[]);
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError("Unable to search for users.");
          }
        } finally {
          if (!controller.signal.aborted) setIsSearching(false);
        }
      }

      void searchUsers();
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const addMember = async (body: { userId: string } | { name: string }) => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const responseBody = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(responseBody?.error ?? "Unable to add member.");
    }
    return (await response.json()) as ApiMember;
  };

  const addRegisteredUser = async (user: RegisteredUser) => {
    if (members.some((member) => member.id === user.id) || addingUserId) return;
    setAddingUserId(user.id);
    setError(null);
    try {
      const member = await addMember({ userId: user.id });
      setMembers((current) => [
        ...current,
        { ...member, status: "Registered" },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add member.",
      );
    } finally {
      setAddingUserId(null);
    }
  };

  const addPlaceholderMember = async () => {
    const name = newMemberName.trim();
    if (!name || isAddingPlaceholder) return;
    setIsAddingPlaceholder(true);
    setError(null);
    try {
      const member = await addMember({ name });
      setMembers((current) => [
        ...current,
        { ...member, status: "Pending" },
      ]);
      setNewMemberName("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add member.",
      );
    } finally {
      setIsAddingPlaceholder(false);
    }
  };

  const renderResult = ({ item }: { item: RegisteredUser }) => {
    const alreadyAdded = members.some((member) => member.id === item.id);
    return (
      <View style={styles.resultCard}>
        <View style={styles.personInfo}>
          <View style={styles.resultAvatar}>
            <Text style={styles.resultAvatarText}>{initials(item.name)}</Text>
          </View>
          <View style={styles.personCopy}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personEmail} numberOfLines={1}>
              {item.email ?? "No email available"}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name}`}
          disabled={alreadyAdded || addingUserId !== null}
          onPress={() => void addRegisteredUser(item)}
          style={({ pressed }) => [
            styles.addButton,
            alreadyAdded && styles.addButtonDisabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.addButtonText}>
            {alreadyAdded
              ? "Added"
              : addingUserId === item.id
                ? "Adding…"
                : "Add"}
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
              isSearching ? (
                <ActivityIndicator
                  color={COLORS.yellow}
                  style={styles.searchSpinner}
                />
              ) : (
                <Text style={styles.emptyResult}>
                  {query.trim()
                    ? "No registered users match."
                    : "Enter a name or email to search."}
                </Text>
              )
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
                    disabled={!newMemberName.trim() || isAddingPlaceholder}
                    onPress={() => void addPlaceholderMember()}
                    style={({ pressed }) => [
                      styles.addMemberButton,
                      (!newMemberName.trim() || isAddingPlaceholder) &&
                        styles.buttonDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialIcons
                      name="person-add-alt"
                      size={19}
                      color={COLORS.yellowInk}
                    />
                    <Text style={styles.addMemberButtonText}>
                      {isAddingPlaceholder
                        ? "Adding…"
                        : newMemberName.trim()
                        ? `Add ${newMemberName.trim()} as Member`
                        : "Add as Member"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.memberHeading}>
                  <Text style={styles.sectionLabel}>ADDED MEMBERS</Text>
                  <Text style={styles.totalBadge}>{members.length} total</Text>
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                {isLoadingMembers ? (
                  <ActivityIndicator
                    color={COLORS.yellow}
                    style={styles.memberSpinner}
                  />
                ) : (
                  members.map((member) => (
                    <View key={member.id} style={styles.memberRow}>
                      <View
                        style={styles.memberIdentity}
                      >
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
                  ))
                )}
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
  searchSpinner: { marginVertical: 18 },
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
  errorText: {
    marginBottom: 10,
    color: "#FFB4AB",
    fontSize: 12,
    lineHeight: 17,
  },
  memberSpinner: { marginVertical: 22 },
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
