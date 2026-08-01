import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
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

type Split = {
  id: string;
  name: string;
  amount: string;
  highlighted?: boolean;
};

const SPLITS: Split[] = [
  { id: "you", name: "You", amount: "₹200.00", highlighted: true },
  { id: "priya", name: "Priya", amount: "₹200.00" },
  { id: "rahul", name: "Rahul", amount: "₹200.00" },
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
          styles.backButton,
          pressed && styles.controlPressed,
        ]}
      >
        <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Dinner</Text>
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
  onBack?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function ExpenseDetailScreen({
  onBack,
  onEdit,
  onDelete,
}: ExpenseDetailScreenProps) {
  const [receiptUri] = useState<string | null>(null);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea}>
        <Header onBack={onBack} />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.categoryIcon}>
              <MaterialIcons
                name="restaurant"
                size={45}
                color={COLORS.yellowInk}
              />
            </View>
            <Text style={styles.amount}>₹600.00</Text>
            <Text style={styles.paidBy}>Paid by You</Text>
            <Text style={styles.date}>OCT 12, 2023</Text>
          </View>

          <View style={styles.section}>
            <SectionHeading>SPLIT BREAKDOWN</SectionHeading>
            <View style={styles.splitList}>
              {SPLITS.map((split) => (
                <Pressable
                  key={split.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${split.name}, ${split.amount}`}
                  onPress={() => undefined}
                  style={({ pressed }) => [
                    styles.splitRow,
                    pressed && styles.splitRowPressed,
                  ]}
                >
                  <Text style={styles.memberName}>{split.name}</Text>
                  <Text
                    style={[
                      styles.memberShare,
                      split.highlighted && styles.highlightedShare,
                    ]}
                  >
                    {split.amount}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.receiptSection}>
            <SectionHeading>RECEIPT</SectionHeading>
            <Receipt receiptUri={receiptUri} />
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onEdit}
              style={({ pressed }) => [
                styles.actionButton,
                styles.editButton,
                pressed && styles.controlPressed,
              ]}
            >
              <MaterialIcons name="edit" size={18} color={COLORS.yellowInk} />
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onDelete}
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                pressed && styles.controlPressed,
              ]}
            >
              <MaterialIcons
                name="delete-outline"
                size={19}
                color={COLORS.redText}
              />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
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
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 36,
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
