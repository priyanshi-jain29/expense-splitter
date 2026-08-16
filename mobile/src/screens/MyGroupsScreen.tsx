import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE_URL, TEST_USER_ID } from "../config/api";

const COLORS = {
  background: "#131313",
  surface: "#1C1B1B",
  surfaceHigh: "#2A2A2A",
  border: "#4D4632",
  text: "#E5E2E1",
  primaryText: "#FFF5DC",
  muted: "#D0C6AB",
  mutedDark: "#817C6E",
  yellow: "#FFD600",
  yellowText: "#3A3000",
  secondaryAvatar: "#474746",
  secondaryText: "#B7B5B4",
};

type Group = {
  id: string;
  name: string;
};

function GroupCard({
  group,
  onPress,
}: {
  group: Group;
  onPress?: (groupId: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${group.name}`}
      onPress={() => onPress?.(group.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Text style={styles.groupName}>{group.name}</Text>
      <View style={styles.cardDivider} />
      <View style={styles.cardFooter}>
        <Text style={styles.activityText}>View group details</Text>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.muted} />
      </View>
    </Pressable>
  );
}

function DashboardHeader({ groupCount }: { groupCount: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>My Groups</Text>
      <Text style={styles.activeCount}>{groupCount} Active</Text>
    </View>
  );
}

function TopBar() {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Wallet"
        hitSlop={10}
        onPress={() => undefined}
        style={styles.topBarButton}
      >
        <MaterialIcons
          name="account-balance-wallet"
          size={22}
          color={COLORS.primaryText}
        />
      </Pressable>

      <Text style={styles.brandTitle}>Social Ledger</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search groups"
        hitSlop={10}
        onPress={() => undefined}
        style={styles.topBarButton}
      >
        <MaterialIcons name="search" size={22} color={COLORS.text} />
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
        <MaterialIcons name="groups" size={23} color={COLORS.yellowText} />
        <Text style={styles.activeNavLabel}>Groups</Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: false }}
        onPress={() => undefined}
        style={styles.navItem}
      >
        <MaterialIcons name="receipt-long" size={22} color="#777466" />
        <Text style={styles.navLabel}>Activity</Text>
      </Pressable>
    </View>
  );
}

type MyGroupsScreenProps = {
  onOpenGroup?: (groupId: string) => void;
  onCreateGroup?: () => void;
};

export default function MyGroupsScreen({
  onOpenGroup,
  onCreateGroup,
}: MyGroupsScreenProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadGroups() {
        setIsLoading(true);
        setError(null);

        try {
          const query = new URLSearchParams({ userId: TEST_USER_ID });
          const response = await fetch(`${API_BASE_URL}/groups?${query}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const data = (await response.json()) as Group[];
          setGroups(data);
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError("Unable to load groups. Check that the backend is running.");
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      }

      void loadGroups();
      return () => controller.abort();
    }, []),
  );

  const renderGroup: ListRenderItem<Group> = ({ item }) => (
    <GroupCard group={item} onPress={onOpenGroup} />
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View pointerEvents="none" style={styles.ambientGlow} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentColumn}>
          <TopBar />
          <FlatList
            data={groups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            ListHeaderComponent={<DashboardHeader groupCount={groups.length} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {isLoading ? (
                  <>
                    <ActivityIndicator color={COLORS.yellow} size="large" />
                    <Text style={styles.emptyText}>Loading groups…</Text>
                  </>
                ) : (
                  <Text style={[styles.emptyText, error && styles.errorText]}>
                    {error ?? "You don't belong to any groups yet."}
                  </Text>
                )}
              </View>
            }
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.cardGap} />}
            showsVerticalScrollIndicator={false}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a new group"
            onPress={onCreateGroup}
            style={({ pressed }) => [
              styles.floatingButton,
              pressed && styles.floatingButtonPressed,
            ]}
          >
            <MaterialIcons name="add" size={30} color={COLORS.yellowText} />
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
  ambientGlow: {
    position: "absolute",
    right: -110,
    bottom: 65,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#554A13",
    opacity: 0.12,
  },
  topBar: {
    height: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(19, 19, 19, 0.96)",
    zIndex: 2,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    color: COLORS.primaryText,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 150,
  },
  emptyState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    rowGap: 14,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: {
    color: "#FFB4AB",
  },
  balanceSummary: {
    paddingHorizontal: 8,
    marginBottom: 28,
  },
  balanceLabel: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 1.35,
  },
  balanceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    columnGap: 8,
    marginTop: 1,
  },
  totalBalance: {
    color: COLORS.primaryText,
    fontSize: 39,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1.3,
  },
  owedLabel: {
    color: COLORS.yellow,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  sectionHeader: {
    paddingHorizontal: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  activeCount: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  card: {
    minHeight: 130,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(28, 27, 27, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 50, 0.22)",
  },
  cardPressed: {
    backgroundColor: COLORS.surfaceHigh,
    transform: [{ scale: 0.985 }],
  },
  groupName: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
  },
  avatarRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarPrimary: {
    backgroundColor: COLORS.yellow,
  },
  avatarSecondary: {
    backgroundColor: COLORS.secondaryAvatar,
  },
  avatarMore: {
    backgroundColor: "#353534",
  },
  avatarText: {
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  avatarPrimaryText: {
    color: "#705D00",
  },
  avatarSecondaryText: {
    color: COLORS.secondaryText,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(77, 70, 50, 0.42)",
    marginTop: 16,
  },
  cardFooter: {
    minHeight: 24,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 10,
  },
  activityText: {
    flexShrink: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  balanceText: {
    flexShrink: 0,
    textAlign: "right",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  positiveBalance: {
    color: COLORS.yellow,
  },
  negativeBalance: {
    color: COLORS.secondaryText,
  },
  settledBalance: {
    color: COLORS.mutedDark,
  },
  cardGap: {
    height: 16,
  },
  floatingButton: {
    position: "absolute",
    right: 24,
    bottom: 94,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 9,
    zIndex: 4,
  },
  floatingButtonPressed: {
    transform: [{ scale: 0.9 }],
  },
  bottomNavigation: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    minHeight: 78,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 38,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "rgba(28, 27, 27, 0.97)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#FFD600",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.035,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 3,
  },
  activeNavItem: {
    minWidth: 74,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.primaryText,
    alignItems: "center",
    justifyContent: "center",
  },
  activeNavLabel: {
    marginTop: 1,
    color: COLORS.yellowText,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
  },
  navItem: {
    minWidth: 74,
    height: 48,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  navLabel: {
    marginTop: 1,
    color: "#777466",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "500",
  },
});
