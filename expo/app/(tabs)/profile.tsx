import { router } from "expo-router";
import { Edit3, ExternalLink, MessageCircle } from "lucide-react-native";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Card, GhostButton, H1, Screen, SectionLabel } from "@/components/ui";
import Colors from "@/constants/colors";
import { formatPhone } from "@/lib/format";
import { sendBetaFeedback } from "@/lib/share";
import { useApp } from "@/providers/AppProvider";

export default function ProfileTab() {
  const { profile, isProfileComplete } = useApp();

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>BUSINESS PROFILE</Text>
          <H1>{profile.businessName || "Set up your\nbusiness"}</H1>

          <View style={{ height: 22 }} />

          {!isProfileComplete && (
            <Card style={{ marginBottom: 18, backgroundColor: "rgba(201,168,76,0.1)" }}>
              <Text style={styles.warnTitle}>Profile incomplete</Text>
              <Body muted>Complete your profile so it shows up on every post.</Body>
            </Card>
          )}

          <SectionLabel>Identity</SectionLabel>
          <Card>
            <Field label="Business" value={profile.businessName} />
            <Field label="Trade" value={profile.trade} />
            <Field label="Location" value={[profile.city, profile.state].filter(Boolean).join(", ")} />
          </Card>

          <View style={{ height: 18 }} />
          <SectionLabel>Contact</SectionLabel>
          <Card>
            <Field label="Phone" value={formatPhone(profile.phone) || profile.phone} />
            <Field label="Website" value={profile.website} />
            <Field label="Google Review Link" value={profile.googleReviewLink} icon={<ExternalLink size={14} color={Colors.gold} />} />
          </Card>

          <View style={{ height: 18 }} />
          <SectionLabel>Services offered ({profile.services.length})</SectionLabel>
          <Card>
            <View style={styles.chipWrap}>
              {profile.services.length === 0 ? (
                <Body muted>No services selected yet.</Body>
              ) : (
                profile.services.map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))
              )}
            </View>
          </Card>

          <View style={{ height: 24 }} />
          <GhostButton
            label="Edit profile"
            icon={<Edit3 size={16} color={Colors.white} />}
            onPress={() => router.push("/profile-edit")}
          />
          <View style={{ height: 12 }} />
          <GhostButton
            label="Send beta feedback"
            icon={<MessageCircle size={16} color={Colors.gold} />}
            onPress={() => sendBetaFeedback()}
          />
          <Text style={styles.betaHint}>You're a beta tester. Tell us what to fix or build next.</Text>
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function Field({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldValueRow}>
        {icon}
        <Text style={[styles.fieldValue, !value ? { color: Colors.textMuted } : null]} numberOfLines={1}>
          {value || "—"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22, paddingTop: 8 },
  kicker: {
    color: Colors.gold, fontSize: 11, letterSpacing: 2.4, fontWeight: "800", marginBottom: 8,
  },
  warnTitle: { color: Colors.gold, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  field: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairlineSoft,
  },
  fieldLabel: {
    color: Colors.textMuted, fontSize: 11, letterSpacing: 1.4, fontWeight: "700", textTransform: "uppercase",
    marginBottom: 4,
  },
  fieldValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fieldValue: { color: Colors.white, fontSize: 15, fontWeight: "600", flex: 1 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(201,168,76,0.13)",
    borderColor: Colors.hairline, borderWidth: 1,
    borderRadius: 999,
  },
  chipText: { color: Colors.gold, fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  betaHint: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
