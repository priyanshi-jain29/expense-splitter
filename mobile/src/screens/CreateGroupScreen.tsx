import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
  error: "#FFB4AB",
};

type Props = {
  onBack?: () => void;
  onCreate?: (name: string) => Promise<void>;
};

export default function CreateGroupScreen({ onBack, onCreate }: Props) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting || !onCreate) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(trimmedName);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create the group. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

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
              onFocus={() => setIsNameFocused(true)}
              onBlur={() => setIsNameFocused(false)}
              placeholder="e.g. Trip to Goa"
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              editable={!isSubmitting}
              onSubmitEditing={() => void handleCreate()}
              style={[styles.input, isNameFocused && styles.inputFocused]}
              value={name}
            />
            <Text style={styles.hint}>
              You can add members after creating the group.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={!name.trim() || isSubmitting}
              onPress={() => void handleCreate()}
              style={({ pressed }) => [
                styles.createButton,
                (!name.trim() || isSubmitting) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.yellowInk} />
              ) : (
                <Text style={styles.createButtonText}>Create Group</Text>
              )}
            </Pressable>
            {error && <Text style={styles.errorText}>{error}</Text>}
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
    outlineWidth: 0,
    outlineStyle: "solid",
    outlineColor: "transparent",
  },
  inputFocused: {
    borderColor: COLORS.text,
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
  errorText: {
    marginTop: 12,
    color: COLORS.error,
    fontSize: 13,
    textAlign: "center",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
});
