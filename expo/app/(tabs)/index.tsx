import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ImagePlus,
  MessageCircle,
  MessageSquareQuote,
  Send,
  Sparkles,
  Star,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Card, GhostButton, H1, PressableScale, PrimaryButton, Screen, SectionLabel } from "@/components/ui";
import Colors from "@/constants/colors";
import { sendBetaFeedback } from "@/lib/share";
import { useApp } from "@/providers/AppProvider";

export default function HomeScreen() {
  const { profile, isProfileComplete, hydrated, posts } = useApp();

  useEffect(() => {
    if (hydrated && !isProfileComplete) {
      const t = setTimeout(() => router.push("/onboarding"), 250);
      return () => clearTimeout(t);
    }
  }, [hydrated, isProfileComplete]);

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {profile.businessName ? profile.businessName.toUpperCase() : "EZ POST"}
              </Text>
              <H1>Post a job{"\n"}in 60 seconds.</H1>
            </View>
              <PressableScale onPress={() => sendBetaFeedback()} style={styles.badge}>
              <MessageCircle size={13} color={Colors.gold} />
              <Text style={styles.badgeText}>BETA · TAP TO SEND FEEDBACK</Text>
            </PressableScale>
          </View>

          <View style={{ height: 28 }} />

          <PrimaryButton
            label="New Before / After"
            icon={<ImagePlus size={20} color={Colors.navyDeep} />}
            onPress={() => router.push("/before-after")}
          />

          <View style={{ height: 14 }} />

          <View style={styles.row}>
            <ActionTile
              icon={<Star size={22} color={Colors.gold} fill={Colors.gold} />}
              title="5-Star Review"
              subtitle="Share + AI reply"
              onPress={() => router.push("/review")}
            />
            <ActionTile
              icon={<Send size={22} color={Colors.gold} />}
              title="Review Request"
              subtitle="SMS or email"
              onPress={() => router.push("/review-request")}
            />
          </View>

          <View style={{ height: 32 }} />

          <SectionLabel>What's coming up</SectionLabel>
          <Card>
            <View style={styles.tipRow}>
              <MessageSquareQuote size={22} color={Colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>Educational + Promo posts</Text>
                <Body muted>Tip-of-the-week & promo graphics. Coming next update.</Body>
              </View>
            </View>
          </Card>

          <View style={{ height: 24 }} />
          <GhostButton
            label="Send beta feedback"
            icon={<MessageCircle size={16} color={Colors.gold} />}
            onPress={() => sendBetaFeedback()}
          />

          {posts.length > 0 && (
            <>
              <View style={{ height: 28 }} />
              <SectionLabel>Recent posts</SectionLabel>
              {posts.slice(0, 3).map((p) => (
                <PressableScale
                  key={p.id}
                  onPress={() => router.push("/(tabs)/history")}
                  style={styles.recentRow}
                >
                  <LinearGradient
                    colors={["rgba(201,168,76,0.15)", "rgba(201,168,76,0)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.recentKind}>
                    {p.kind === "before-after" ? "BEFORE / AFTER" : p.kind === "review" ? "5-STAR REVIEW" : "REVIEW REQUEST"}
                  </Text>
                  <Text style={styles.recentDate}>{new Date(p.createdAt).toLocaleString()}</Text>
                </PressableScale>
              ))}
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function ActionTile({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} style={styles.tile}>
      <View style={styles.tileIcon}>{icon}</View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSub}>{subtitle}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: {
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 2.4,
    fontWeight: "800",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    backgroundColor: "rgba(201,168,76,0.12)",
    borderColor: Colors.hairline,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 6,
  },
  badgeText: { color: Colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  row: { flexDirection: "row", gap: 14 },
  tile: {
    flex: 1,
    backgroundColor: Colors.navySurface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
  },
  tileIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(201,168,76,0.13)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  tileTitle: { color: Colors.white, fontSize: 16, fontWeight: "800", marginBottom: 4 },
  tileSub: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  tipRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  tipTitle: { color: Colors.white, fontSize: 15, fontWeight: "700", marginBottom: 4 },
  recentRow: {
    backgroundColor: Colors.navySurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    overflow: "hidden",
  },
  recentKind: { color: Colors.gold, fontSize: 11, letterSpacing: 1.6, fontWeight: "800" },
  recentDate: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
});
