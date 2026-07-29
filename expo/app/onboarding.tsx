import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, Check, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Body,
  FieldInput,
  GhostButton,
  H1,
  H2,
  PressableScale,
  PrimaryButton,
  Screen,
  SectionLabel,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { TRADE_PRESETS } from "@/constants/services";
import { formatPhone } from "@/lib/format";
import { useApp } from "@/providers/AppProvider";
import type { BusinessProfile } from "@/types";

const STEPS = ["Trade", "Identity", "Contact", "Services"] as const;

export default function Onboarding() {
  const { profile, saveProfile } = useApp();
  const [step, setStep] = useState<number>(0);
  const [draft, setDraft] = useState<BusinessProfile>(profile);

  const set = (patch: Partial<BusinessProfile>) => setDraft((d) => ({ ...d, ...patch }));

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish();
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
    else router.back();
  };
  const finish = async () => {
    await saveProfile(draft);
    router.dismissAll?.();
    router.replace("/(tabs)");
  };

  const trade = TRADE_PRESETS.find((t) => t.id === draft.trade) ?? TRADE_PRESETS[0];

  const stepValid = (() => {
    if (step === 0) return !!draft.trade;
    if (step === 1) return draft.businessName.trim().length > 0;
    if (step === 2) return draft.phone.trim().length > 0 && draft.city.trim().length > 0 && draft.state.trim().length > 0;
    return true;
  })();

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
            <X color={Colors.white} size={22} />
          </Pressable>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
          </View>
          <Text style={styles.stepText}>
            {step + 1}/{STEPS.length}
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={20}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.kicker}>WELCOME TO EZ POST</Text>

            {step === 0 && (
              <>
                <H1>What kind of work{"\n"}do you do?</H1>
                <Body muted style={{ marginTop: 8 } as never}>This shapes the services we suggest.</Body>
                <View style={{ height: 22 }} />
                <View style={styles.tradeGrid}>
                  {TRADE_PRESETS.map((t) => {
                    const selected = draft.trade === t.id;
                    return (
                      <PressableScale
                        key={t.id}
                        onPress={() => set({ trade: t.id, services: t.services.filter((s) => s !== "Other") })}
                        style={[styles.tradeChip, selected ? styles.tradeChipSelected : null]}
                      >
                        <Text style={[styles.tradeChipText, selected ? styles.tradeChipTextSelected : null]}>
                          {t.label}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </>
            )}

            {step === 1 && (
              <>
                <H1>Who are you?</H1>
                <View style={{ height: 22 }} />
                <LogoPicker uri={draft.logoUri} onPick={(u) => set({ logoUri: u })} />
                <View style={{ height: 18 }} />
                <FieldInput
                  label="Business Name"
                  value={draft.businessName}
                  onChangeText={(v) => set({ businessName: v })}
                  placeholder="e.g. Bluebird Soft Wash"
                  autoCapitalize="words"
                />
              </>
            )}

            {step === 2 && (
              <>
                <H1>How do customers{"\n"}reach you?</H1>
                <View style={{ height: 22 }} />
                <FieldInput
                  label="Phone"
                  value={draft.phone}
                  onChangeText={(v) => set({ phone: formatPhone(v) })}
                  placeholder="(555) 555-5555"
                  keyboardType="phone-pad"
                  maxLength={14}
                />
                <View style={styles.row}>
                  <View style={{ flex: 2 }}>
                    <FieldInput
                      label="City"
                      value={draft.city}
                      onChangeText={(v) => set({ city: v })}
                      placeholder="Charlotte"
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <FieldInput
                      label="State"
                      value={draft.state}
                      onChangeText={(v) => set({ state: v.toUpperCase().slice(0, 2) })}
                      placeholder="NC"
                      autoCapitalize="characters"
                      maxLength={2}
                    />
                  </View>
                </View>
                <FieldInput
                  label="Website (optional)"
                  value={draft.website}
                  onChangeText={(v) => set({ website: v })}
                  placeholder="yoursite.com"
                  keyboardType="url"
                />
                <FieldInput
                  label="Google Review Link (optional)"
                  value={draft.googleReviewLink}
                  onChangeText={(v) => set({ googleReviewLink: v })}
                  placeholder="g.page/r/..."
                  keyboardType="url"
                />
              </>
            )}

            {step === 3 && (
              <>
                <H1>Which services{"\n"}do you offer?</H1>
                <Body muted style={{ marginTop: 8 } as never}>Tap to toggle. You can change these anytime.</Body>
                <View style={{ height: 18 }} />
                <SectionLabel>{trade.label}</SectionLabel>
                <View style={styles.serviceWrap}>
                  {trade.services.map((s) => {
                    const on = draft.services.includes(s);
                    return (
                      <PressableScale
                        key={s}
                        onPress={() =>
                          set({
                            services: on
                              ? draft.services.filter((x) => x !== s)
                              : [...draft.services, s],
                          })
                        }
                        style={[styles.serviceChip, on ? styles.serviceChipOn : null]}
                      >
                        {on ? <Check size={14} color={Colors.navyDeep} /> : null}
                        <Text style={[styles.serviceText, on ? styles.serviceTextOn : null]}>{s}</Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </>
            )}

            <View style={{ height: 28 }} />
            <PrimaryButton
              label={step === STEPS.length - 1 ? "Finish setup" : "Continue"}
              onPress={next}
              disabled={!stepValid}
            />
            <View style={{ height: 12 }} />
            <GhostButton label="Back" onPress={back} />
            <View style={{ height: 24 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  );
}

function LogoPicker({ uri, onPick }: { uri: string | null; onPick: (u: string | null) => void }) {
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!r.canceled && r.assets[0]) onPick(r.assets[0].uri);
  };
  return (
    <View style={{ alignItems: "flex-start" }}>
      <Text style={styles.fieldLabel}>LOGO (OPTIONAL)</Text>
      <PressableScale onPress={pick} style={styles.logoBox}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.logoEmpty}>
            <Camera size={22} color={Colors.gold} />
            <Text style={styles.logoEmptyText}>Tap to add</Text>
          </View>
        )}
      </PressableScale>
      {uri ? (
        <Pressable onPress={() => onPick(null)} hitSlop={12}>
          <Text style={{ color: Colors.danger, marginTop: 8, fontWeight: "700", fontSize: 12 }}>Remove logo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    gap: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Colors.gold },
  stepText: { color: Colors.gold, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 },
  scroll: { paddingHorizontal: 22, paddingTop: 8 },
  kicker: { color: Colors.gold, fontSize: 11, letterSpacing: 2.4, fontWeight: "800", marginBottom: 12 },
  row: { flexDirection: "row" },
  tradeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tradeChip: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.navySurface,
    borderColor: Colors.hairlineSoft, borderWidth: 1,
  },
  tradeChipSelected: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  tradeChipText: { color: Colors.white, fontWeight: "700", fontSize: 14 },
  tradeChipTextSelected: { color: Colors.navyDeep },
  fieldLabel: {
    color: Colors.gold, fontSize: 11, letterSpacing: 1.6,
    fontWeight: "700", textTransform: "uppercase", marginBottom: 8,
  },
  logoBox: {
    width: 110, height: 110, borderRadius: 18, overflow: "hidden",
    backgroundColor: Colors.navyDeep,
    borderWidth: 1, borderColor: Colors.hairline,
  },
  logoEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  logoEmptyText: { color: Colors.gold, fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  serviceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.navySurface,
    borderColor: Colors.hairlineSoft, borderWidth: 1,
    flexDirection: "row", gap: 6, alignItems: "center",
  },
  serviceChipOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  serviceText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  serviceTextOn: { color: Colors.navyDeep },
});
