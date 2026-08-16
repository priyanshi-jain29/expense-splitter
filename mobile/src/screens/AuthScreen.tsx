import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { authClient } from "../config/auth-client";

const COLORS = {
  background: "#121311",
  backgroundTint: "#102321",
  surface: "#1D1E1C",
  input: "#20211F",
  border: "#2C2D2A",
  text: "#F5F2E8",
  muted: "#94958F",
  yellow: "#FFD600",
  black: "#10110F",
  white: "#FFFFFF",
  error: "#FFB4AB",
};

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  icon: "user" | "mail" | "lock";
  secureTextEntry?: boolean;
  rightAccessory?: React.ReactNode;
  keyboardType?: "default" | "email-address";
  textContentType?: "name" | "emailAddress" | "password" | "newPassword";
};

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandMark, compact && styles.brandMarkCompact]}>
      <View style={styles.brandMarkInner}>
        <View style={styles.brandMarkCutout} />
        <View style={styles.brandMarkDot} />
      </View>
    </View>
  );
}

function FieldIcon({ type }: { type: FieldProps["icon"] }) {
  if (type === "mail") {
    return (
      <View style={styles.mailIcon}>
        <View style={styles.mailFlapLeft} />
        <View style={styles.mailFlapRight} />
      </View>
    );
  }

  if (type === "lock") {
    return (
      <View style={styles.lockIcon}>
        <View style={styles.lockShackle} />
        <View style={styles.lockBody}>
          <View style={styles.lockDot} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.userIcon}>
      <View style={styles.userHead} />
      <View style={styles.userShoulders} />
    </View>
  );
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <View style={styles.eyeIcon}>
      <View style={styles.eyePupil} />
      {hidden && <View style={styles.eyeSlash} />}
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  rightAccessory,
  keyboardType = "default",
  textContentType,
}: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {rightAccessory}
      </View>
      <View
        style={[styles.inputShell, isFocused && styles.inputShellFocused]}
      >
        <FieldIcon type={icon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#6F706B"
          style={styles.input}
          autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
          autoCorrect={false}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          textContentType={textContentType}
          selectionColor={COLORS.yellow}
        />
      </View>
    </View>
  );
}

function GoogleButton({ signup }: { signup: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={signup ? "Continue with Google" : "Sign in with Google"}
      style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
      onPress={() => undefined}
    >
      <View style={styles.googleBadge}>
        <Text style={styles.googleLetter}>G</Text>
      </View>
      <Text style={styles.googleText}>
        {signup ? "Continue with Google" : "Sign in with Google"}
      </Text>
    </Pressable>
  );
}

type AuthScreenProps = {
  initialMode?: "login" | "signup";
  onAuthenticated?: () => void;
  onSwitchMode?: () => void;
};

export default function AuthScreen({
  initialMode = "login",
  onAuthenticated,
  onSwitchMode,
}: AuthScreenProps) {
  const [isSignup, setIsSignup] = useState(initialMode === "signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    if (!normalizedEmail || !password || (isSignup && !normalizedName)) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = isSignup
        ? await authClient.signUp.email({
            name: normalizedName,
            email: normalizedEmail,
            password,
          })
        : await authClient.signIn.email({
            email: normalizedEmail,
            password,
          });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed.");
        return;
      }

      onAuthenticated?.();
    } catch {
      setError("Unable to reach the authentication server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    if (onSwitchMode) {
      onSwitchMode();
      return;
    }
    setIsSignup((current) => !current);
    setShowPassword(false);
    setError(null);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View pointerEvents="none" style={styles.bottomTint} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              isSignup ? styles.signupScrollContent : styles.loginScrollContent,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isSignup ? (
              <View style={styles.compactBrand}>
                <BrandMark compact />
                <Text style={styles.compactBrandText}>Social Ledger</Text>
              </View>
            ) : (
              <View style={styles.hero}>
                <BrandMark />
                <Text style={styles.heroTitle}>Social Ledger</Text>
                <Text style={styles.heroSubtitle}>
                  Harmonious finance for shared experiences.
                </Text>
              </View>
            )}

            <View style={[styles.card, isSignup && styles.signupCard]}>
              {isSignup && (
                <View style={styles.signupHeading}>
                  <View style={styles.yellowTab} />
                  <Text style={styles.cardTitle}>Join the collective</Text>
                  <Text style={styles.cardSubtitle}>
                    Split costs, not friendships. Create your{"\n"}
                    account to start managing shared{"\n"}
                    expenses with ease.
                  </Text>
                </View>
              )}

              {isSignup && (
                <FormField
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Alex Johnson"
                  icon="user"
                  textContentType="name"
                />
              )}

              <FormField
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder={isSignup ? "alex@example.com" : "yourname@example.com"}
                icon="mail"
                keyboardType="email-address"
                textContentType="emailAddress"
              />

              <FormField
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                icon="lock"
                secureTextEntry={!showPassword}
                textContentType={isSignup ? "newPassword" : "password"}
                rightAccessory={
                  isSignup ? (
                    <Pressable
                      hitSlop={12}
                      onPress={() => setShowPassword((visible) => !visible)}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                    >
                      <EyeIcon hidden={!showPassword} />
                    </Pressable>
                  ) : (
                    <Pressable hitSlop={10} onPress={() => undefined}>
                      <Text style={styles.forgotText}>Forgot?</Text>
                    </Pressable>
                  )
                }
              />

              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  isSubmitting && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.black} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {isSignup ? "Create account" : "Log in"}
                    </Text>
                    {isSignup && <Text style={styles.arrow}>→</Text>}
                  </>
                )}
              </Pressable>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <GoogleButton signup={isSignup} />
            </View>

            <View style={styles.modeRow}>
              <Text style={styles.modePrompt}>
                {isSignup ? "Already have an account? " : "New here? "}
              </Text>
              <Pressable onPress={switchMode} hitSlop={10}>
                <Text style={styles.modeAction}>
                  {isSignup ? "Log in" : "Create an account"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomTint: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    top: "47%",
    backgroundColor: COLORS.backgroundTint,
    opacity: 0.72,
  },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  loginScrollContent: {
    justifyContent: "center",
    paddingTop: 28,
  },
  signupScrollContent: {
    justifyContent: "center",
    paddingTop: 18,
  },
  hero: {
    alignItems: "center",
    marginBottom: 34,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#62591A",
    backgroundColor: "#292713",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brandMarkCompact: {
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 0,
    backgroundColor: COLORS.yellow,
    marginBottom: 0,
  },
  brandMarkInner: {
    width: 18,
    height: 18,
    borderWidth: 3,
    borderColor: COLORS.yellow,
    borderRadius: 2,
  },
  brandMarkCutout: {
    position: "absolute",
    right: -3,
    top: 4,
    width: 8,
    height: 7,
    backgroundColor: COLORS.background,
  },
  brandMarkDot: {
    position: "absolute",
    right: 1,
    top: 5,
    width: 5,
    height: 5,
    borderWidth: 2,
    borderColor: COLORS.yellow,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -1.4,
  },
  heroSubtitle: {
    marginTop: 2,
    color: "#D2D0C7",
    fontSize: 12,
    lineHeight: 17,
  },
  compactBrand: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 34,
  },
  compactBrandText: {
    marginLeft: 6,
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.9,
  },
  card: {
    width: "100%",
    maxWidth: 390,
    alignSelf: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  signupCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 0,
    paddingBottom: 22,
    overflow: "hidden",
  },
  signupHeading: {
    marginHorizontal: -4,
    marginBottom: 29,
    paddingTop: 19,
  },
  yellowTab: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 91,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.yellow,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  cardSubtitle: {
    color: "#D1D0CA",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabelRow: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
    paddingHorizontal: 2,
  },
  fieldLabel: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  forgotText: {
    color: COLORS.yellow,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  inputShell: {
    height: 49,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 8,
    backgroundColor: COLORS.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  inputShellFocused: {
    borderColor: COLORS.white,
  },
  input: {
    flex: 1,
    height: "100%",
    minWidth: 0,
    color: COLORS.text,
    fontSize: 13,
    paddingHorizontal: 13,
    paddingVertical: 0,
    borderWidth: 0,
    outlineWidth: 0,
    outlineStyle: "solid",
    outlineColor: "transparent",
  },
  mailIcon: {
    width: 16,
    height: 12,
    borderWidth: 1.2,
    borderColor: "#DBDAD2",
    borderRadius: 2,
    overflow: "hidden",
  },
  mailFlapLeft: {
    position: "absolute",
    width: 11,
    height: 1,
    backgroundColor: "#DBDAD2",
    left: -1,
    top: 3,
    transform: [{ rotate: "31deg" }],
  },
  mailFlapRight: {
    position: "absolute",
    width: 11,
    height: 1,
    backgroundColor: "#DBDAD2",
    right: -1,
    top: 3,
    transform: [{ rotate: "-31deg" }],
  },
  lockIcon: {
    width: 16,
    height: 18,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  lockShackle: {
    position: "absolute",
    top: 0,
    width: 8,
    height: 8,
    borderWidth: 1.3,
    borderColor: "#DBDAD2",
    borderRadius: 5,
  },
  lockBody: {
    width: 13,
    height: 11,
    borderWidth: 1.3,
    borderColor: "#DBDAD2",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.input,
  },
  lockDot: {
    width: 2,
    height: 3,
    borderRadius: 1,
    backgroundColor: "#DBDAD2",
  },
  userIcon: {
    width: 16,
    height: 17,
    alignItems: "center",
  },
  userHead: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: "#DBDAD2",
  },
  userShoulders: {
    position: "absolute",
    bottom: 1,
    width: 10,
    height: 6,
    borderWidth: 1.2,
    borderColor: "#DBDAD2",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  eyeIcon: {
    width: 16,
    height: 10,
    borderWidth: 1.1,
    borderColor: "#D8D7D0",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scaleY: 0.72 }],
  },
  eyePupil: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D8D7D0",
  },
  eyeSlash: {
    position: "absolute",
    width: 19,
    height: 1,
    backgroundColor: COLORS.surface,
    transform: [{ rotate: "-35deg" }],
  },
  primaryButton: {
    height: 50,
    marginTop: 11,
    borderRadius: 8,
    backgroundColor: COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.65,
  },
  errorText: {
    marginTop: 12,
    color: COLORS.error,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  arrow: {
    color: "#4B4818",
    fontSize: 18,
    marginLeft: 9,
    marginTop: -1,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 21,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#30312E",
  },
  orText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "600",
    marginHorizontal: 14,
  },
  googleButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#30312E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleBadge: {
    width: 18,
    height: 18,
    backgroundColor: COLORS.white,
    borderRadius: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  googleLetter: {
    color: "#4285F4",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },
  googleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.78,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 43,
  },
  modePrompt: {
    color: "#D0CFC7",
    fontSize: 12,
  },
  modeAction: {
    color: COLORS.yellow,
    fontSize: 12,
    fontWeight: "700",
  },
});
