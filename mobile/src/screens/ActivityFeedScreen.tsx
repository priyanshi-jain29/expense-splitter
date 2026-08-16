import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";
import { authClient } from "../config/auth-client";

const COLORS = {
  outer: "#000000",
  background: "#131313",
  surface: "#201F1F",
  surfaceHigh: "#2A2A2A",
  border: "#4D4632",
  text: "#E5E2E1",
  muted: "#D0C6AB",
  yellow: "#FFD600",
  yellowSoft: "#FFE170",
  yellowInk: "#221B00",
  cyan: "#00DCE7",
  cyanDark: "#00696F",
};

type ActivityItem = {
  id: string;
  type: "expense" | "settlement";
  description: string;
  amount: number;
  timestamp: string;
  groupId: string;
  group: string;
};

const ICONS: Record<ActivityItem["type"], keyof typeof MaterialIcons.glyphMap> = {
  expense: "receipt-long",
  settlement: "handshake",
};

const formatAmount = (amount: number) =>
  amount.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const formatTime = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

function sectionTitle(timestamp: string) {
  const activityDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (activityDate.toDateString() === today.toDateString()) return "Today";
  if (activityDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return activityDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Header() {
  return (
    <View style={styles.header}>
      <MaterialIcons
        name="account-balance-wallet"
        size={23}
        color={COLORS.yellow}
      />
      <Text style={styles.title}>Activity</Text>
    </View>
  );
}

function ActivityCard({
  item,
  onPress,
}: {
  item: ActivityItem;
  onPress?: () => void;
}) {
  const isSettlement = item.type === "settlement";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.description}, ₹${formatAmount(item.amount)}, ${item.group}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.eventIcon,
          isSettlement && styles.settlementEventIcon,
        ]}
      >
        <MaterialIcons
          name={ICONS[item.type]}
          size={20}
          color={
            isSettlement ? COLORS.cyan : COLORS.yellow
          }
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.descriptionRow}>
          <Text style={styles.description}>
            {item.description}
          </Text>
          <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
        </View>

        <Text
          style={[
            styles.detail,
            isSettlement && styles.settlementDetail,
          ]}
        >
          ₹{formatAmount(item.amount)}
        </Text>

        <View style={styles.groupRow}>
          <MaterialIcons
            name="groups"
            size={13}
            color={COLORS.muted}
          />
          <Text style={styles.groupName}>{item.group}</Text>
        </View>
      </View>
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
          pressed && styles.navPressed,
        ]}
      >
        <MaterialIcons name="groups" size={21} color={COLORS.muted} />
        <Text style={styles.inactiveNavLabel}>Groups</Text>
      </Pressable>

      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
        onPress={() => undefined}
        style={({ pressed }) => [
          styles.navItem,
          styles.activeNavItem,
          pressed && styles.navPressed,
        ]}
      >
        <MaterialIcons name="history" size={20} color={COLORS.yellowInk} />
        <Text style={styles.activeNavLabel}>Activity</Text>
      </Pressable>
    </View>
  );
}

type ActivityFeedScreenProps = {
  onOpenExpense?: (groupId: string, expenseId: string) => void;
};

export default function ActivityFeedScreen({
  onOpenExpense,
}: ActivityFeedScreenProps) {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();

      async function loadActivity() {
        setIsLoading(true);
        setError(null);

        if (isSessionPending) return;
        const userId = session?.user.id;
        if (!userId) {
          setActivity([]);
          setError("Please log in to view activity.");
          setIsLoading(false);
          return;
        }

        try {
          const query = new URLSearchParams({ userId });
          const groupsResponse = await fetch(`${API_BASE_URL}/groups?${query}`, {
            signal: controller.signal,
            credentials: "include",
          });
          if (!groupsResponse.ok) {
            throw new Error("Unable to load groups");
          }
          const groups = (await groupsResponse.json()) as Array<{
            id: string;
            name: string;
          }>;
          const activityByGroup = await Promise.all(
            groups.map(async (group) => {
              const response = await fetch(
                `${API_BASE_URL}/groups/${group.id}/activity`,
                { signal: controller.signal, credentials: "include" },
              );
              if (!response.ok) {
                throw new Error("Unable to load group activity");
              }
              const items = (await response.json()) as Array<
                Omit<ActivityItem, "groupId" | "group">
              >;
              return items.map((item) => ({
                ...item,
                groupId: group.id,
                group: group.name,
              }));
            }),
          );
          setActivity(
            activityByGroup
              .flat()
              .sort(
                (first, second) =>
                  new Date(second.timestamp).getTime() -
                  new Date(first.timestamp).getTime(),
              ),
          );
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name !== "AbortError"
          ) {
            setError("Unable to load activity. Please try again.");
          }
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      }

      void loadActivity();
      return () => controller.abort();
    }, [isSessionPending, session?.user.id]),
  );

  const sections = useMemo(() => {
    const grouped = new Map<string, ActivityItem[]>();
    for (const item of activity) {
      const title = sectionTitle(item.timestamp);
      grouped.set(title, [...(grouped.get(title) ?? []), item]);
    }
    return [...grouped].map(([title, data]) => ({ title, data }));
  }, [activity]);

  return (
    <View style={styles.outer}>
      <View style={styles.screen}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
        />
        <SafeAreaView style={styles.safeArea}>
          <Header />
          <SectionList
            sections={sections}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <ActivityCard
                item={item}
                onPress={
                  item.type === "expense"
                    ? () => onOpenExpense?.(item.groupId, item.id)
                    : undefined
                }
              />
            )}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            ItemSeparatorComponent={() => <View style={styles.cardGap} />}
            SectionSeparatorComponent={() => (
              <View style={styles.sectionGap} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {isLoading ? (
                  <>
                    <ActivityIndicator color={COLORS.yellow} size="large" />
                    <Text style={styles.listEndText}>Loading activity…</Text>
                  </>
                ) : (
                  <Text style={[styles.listEndText, error && styles.errorText]}>
                    {error ?? "No activity yet."}
                  </Text>
                )}
              </View>
            }
            ListFooterComponent={activity.length > 0 ? (
              <View style={styles.listEnd}>
                <MaterialIcons
                  name="history"
                  size={38}
                  color={COLORS.border}
                />
                <Text style={styles.listEndText}>
                  That&apos;s everything for now.
                </Text>
              </View>
            ) : null}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedContent}
          />
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.outer,
  },
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: 390,
    backgroundColor: COLORS.background,
  },
  safeArea: { flex: 1 },
  header: {
    minHeight: 59,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginTop: 22,
    marginBottom: 8,
  },
  card: {
    minHeight: 118,
    padding: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  mutedCard: { opacity: 0.8 },
  cardPressed: { backgroundColor: COLORS.surfaceHigh },
  eventIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255, 214, 0, 0.10)",
  },
  settlementEventIcon: {
    backgroundColor: "rgba(0, 240, 252, 0.10)",
  },
  mutedEventIcon: {
    backgroundColor: "rgba(77, 70, 50, 0.20)",
  },
  cardContent: { flex: 1, minWidth: 0 },
  descriptionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  description: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
  },
  actor: { fontWeight: "700" },
  subject: { color: COLORS.yellowSoft, fontStyle: "italic" },
  time: {
    flexShrink: 0,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  detail: {
    color: COLORS.yellow,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginTop: 4,
  },
  settlementDetail: { color: COLORS.cyanDark },
  mutedDetail: { color: COLORS.muted },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  groupName: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  cardGap: { height: 8 },
  sectionGap: { height: 16 },
  listEnd: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    rowGap: 12,
  },
  errorText: {
    color: "#FFB4AB",
  },
  listEndText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginTop: 12,
  },
  bottomNavigation: {
    height: 80,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  navItem: {
    minWidth: 104,
    minHeight: 56,
    paddingHorizontal: 24,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
  },
  activeNavItem: { backgroundColor: COLORS.yellow },
  inactiveNavLabel: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  activeNavLabel: {
    color: COLORS.yellowInk,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  navPressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
});
