import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
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
  border: "#4D4632",
  text: "#E5E2E1",
  muted: "#D0C6AB",
  yellow: "#FFD600",
  yellowInk: "#221B00",
};

type Props = {
  onBack?: () => void;
  onCreate?: () => void;
};

export default function CreateGroupScreen({ onBack, onCreate }: Props) {
  const [name, setName] = useState("");

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={onBack}
              style={styles.iconButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
            </Pressable>
            <Text style={styles.title}>Create Group</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.groupIcon}>
              <MaterialIcons name="groups" size={40} color={COLORS.yellowInk} />
            </View>
            <Text style={styles.label}>GROUP NAME</Text>
            <TextInput
              accessibilityLabel="Group name"
              autoFocus
              onChangeText={setName}
              placeholder="e.g. Trip to Goa"
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              style={styles.input}
              value={name}
            />
            <Text style={styles.hint}>
              You can add members after creating the group.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={!name.trim()}
              onPress={onCreate}
              style={({ pressed }) => [
                styles.createButton,
                !name.trim() && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.createButtonText}>Create Group</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: COLORS.background },
  safeArea: { flex: 1 },
  header: {
    minHeight: 64,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 42 },
  groupIcon: {
    width: 80,
    height: 80,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.yellow,
    borderRadius: 40,
    marginBottom: 40,
  },
  label: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
  },
  hint: { color: COLORS.muted, fontSize: 12, marginTop: 10 },
  createButton: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.yellow,
    borderRadius: 12,
    marginTop: 36,
  },
  createButtonText: {
    color: COLORS.yellowInk,
    fontSize: 16,
    fontWeight: "800",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
