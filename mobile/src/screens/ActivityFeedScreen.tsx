import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

type ActivityKind = "expense" | "settled" | "updated" | "payment";

type ActivityItem = {
  id: string;
  kind: ActivityKind;
  actor: string;
  action: string;
  subject?: string;
  detail: string;
  group: string;
  groupIcon: "groups" | "home" | "family-restroom";
  time: string;
};

const ACTIVITY_SECTIONS: { title: string; data: ActivityItem[] }[] = [
  {
    title: "Today",
    data: [
      {
        id: "dinner",
        kind: "expense",
        actor: "Priya",
        action: "added",
        subject: '"Dinner"',
        detail: "₹600",
        group: "Trip to Goa",
        groupIcon: "groups",
        time: "2h ago",
      },
      {
        id: "settled",
        kind: "settled",
        actor: "Rahul",
        action: "settled with you",
        detail: "Balance cleared",
        group: "Roommates",
        groupIcon: "home",
        time: "5h ago",
      },
    ],
  },
  {
    title: "Yesterday",
    data: [
      {
        id: "fuel",
        kind: "expense",
        actor: "Ankit",
        action: "added",
        subject: '"Fuel"',
        detail: "₹1,200",
        group: "Trip to Goa",
        groupIcon: "groups",
        time: "Yesterday",
      },
      {
        id: "groceries",
        kind: "updated",
        actor: "You",
        action: "updated",
        subject: '"Groceries"',
        detail: "Amount changed to ₹450",
        group: "Roommates",
        groupIcon: "home",
        time: "Yesterday",
      },
      {
        id: "netflix",
        kind: "payment",
        actor: "Ishani",
        action: "paid you for",
        subject: '"Netflix"',
        detail: "₹199",
        group: "Family Plan",
        groupIcon: "family-restroom",
        time: "Yesterday",
      },
    ],
  },
];

const ICONS: Record<ActivityKind, keyof typeof MaterialIcons.glyphMap> = {
  expense: "receipt-long",
  settled: "handshake",
  updated: "edit",
  payment: "check-circle",
};

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
  const isSettlement = item.kind === "settled" || item.kind === "payment";
  const isMuted = item.kind === "updated";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.actor} ${item.action}${
        item.subject ? ` ${item.subject}` : ""
      }, ${item.detail}, ${item.group}, ${item.time}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isMuted && styles.mutedCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.eventIcon,
          isSettlement && styles.settlementEventIcon,
          isMuted && styles.mutedEventIcon,
        ]}
      >
        <MaterialIcons
          name={ICONS[item.kind]}
          size={20}
          color={
            isSettlement
              ? COLORS.cyan
              : isMuted
                ? COLORS.muted
                : COLORS.yellow
          }
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.descriptionRow}>
          <Text style={styles.description}>
            <Text style={styles.actor}>{item.actor}</Text> {item.action}
            {item.subject ? (
              <Text style={styles.subject}> {item.subject}</Text>
            ) : null}
          </Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <Text
          style={[
            styles.detail,
            isSettlement && styles.settlementDetail,
            isMuted && styles.mutedDetail,
          ]}
        >
          {item.detail}
        </Text>

        <View style={styles.groupRow}>
          <MaterialIcons
            name={item.groupIcon}
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
  onOpenExpense?: (expenseId: string) => void;
};

export default function ActivityFeedScreen({
  onOpenExpense,
}: ActivityFeedScreenProps) {
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
            sections={ACTIVITY_SECTIONS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ActivityCard
                item={item}
                onPress={() => onOpenExpense?.(item.id)}
              />
            )}
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            ItemSeparatorComponent={() => <View style={styles.cardGap} />}
            SectionSeparatorComponent={() => (
              <View style={styles.sectionGap} />
            )}
            ListFooterComponent={
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
            }
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
