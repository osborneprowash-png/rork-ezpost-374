import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import Colors from "@/constants/colors";

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.screen, style]}>
      <LinearGradient
        colors={[Colors.navyDeep, Colors.navy, Colors.navyDeep]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function H1({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <Text style={[styles.h1, style as never]}>{children}</Text>;
}

export function H2({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <Text style={[styles.h2, style as never]}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: ViewStyle }) {
  return <Text style={[styles.body, muted ? { color: Colors.textSecondary } : null, style as never]}>{children}</Text>;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const Wrap = onPress ? PressableScale : View;
  return (
    <Wrap onPress={onPress} style={[styles.card, style]}>
      <View pointerEvents="none" style={styles.cardHairline} />
      {children}
    </Wrap>
  );
}

export function PressableScale({
  children,
  onPress,
  style,
  haptic = true,
  disabled,
  testID,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  haptic?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
      }}
      onPress={() => {
        if (haptic && Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.();
      }}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style as never]}>{children}</Animated.View>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  icon,
  testID,
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  testID?: string;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primaryBtn, (disabled || loading) ? { opacity: 0.5 } : null] as ViewStyle[]}
      testID={testID}
    >
      <LinearGradient
        colors={[Colors.goldBright, Colors.gold]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.primaryBtnInner}>
        {icon}
        <Text style={styles.primaryBtnText}>{loading ? "Working..." : label}</Text>
      </View>
    </PressableScale>
  );
}

export function GhostButton({
  label,
  onPress,
  icon,
  destructive,
}: {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <PressableScale onPress={onPress} style={styles.ghostBtn}>
      <View style={styles.ghostInner}>
        {icon}
        <Text style={[styles.ghostText, destructive ? { color: Colors.danger } : null]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

export function FieldInput({ label, ...rest }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
      />
    </View>
  );
}

export function NavRow({
  title,
  subtitle,
  onPress,
  leading,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leading?: React.ReactNode;
}) {
  return (
    <PressableScale onPress={onPress} style={styles.navRow}>
      {leading ? <View style={styles.navIcon}>{leading}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.navTitle}>{title}</Text>
        {subtitle ? <Text style={styles.navSub}>{subtitle}</Text> : null}
      </View>
      <ChevronRight color={Colors.gold} size={20} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  sectionLabel: {
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  h1: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  h2: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  body: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.navySurface,
    borderRadius: 18,
    padding: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
  },
  cardHairline: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.gold,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  primaryBtnText: {
    color: Colors.navyDeep,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  ghostBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  ghostInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  ghostText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.4,
  },
  fieldLabel: {
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 1.6,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.navyDeep,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    color: Colors.white,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.navySurface,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
  },
  navIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(201,168,76,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  navSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});
