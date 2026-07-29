import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, Check } from "lucide-react-native";
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
import {
  Body,
  FieldInput,
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

export default function ProfileEdit() {
  const { profile, saveProfile } = useApp();
  const [draft, setDraft] = useState<BusinessProfile>(profile);
  const set = (p: Partial<BusinessProfile>) => setDraft((d) => ({ ...d, ...p }));

  const trade = TRADE_PRESETS.find((t) => t.id === draft.trade) ?? TRADE_PRESETS[0];

  const pickLogo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!r.canceled && r.assets[0]) set({ logoUri: r.assets[0].uri });
  };

  const save = async () => {
    await saveProfile(draft);
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <SectionLabel>Logo</SectionLabel>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <PressableScale onPress={pickLogo} style={styles.logoBox}>
              {draft.logoUri ? (
                <Image source={{ uri: draft.logoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={styles.logoEmpty}>
                  <Camera size={22} color={Colors.gold} />
                </View>
              )}
            </PressableScale>
            <View style={{ flex: 1 }}>
              <Body muted>Square logo (PNG/JPG). Used on every post.</Body>
              {draft.logoUri ? (
                <Pressable onPress={() => set({ logoUri: null })} hitSlop={10}>
                  <Text style={{ color: Colors.danger, marginTop: 8, fontWeight: "700", fontSize: 12 }}>
                    Remove logo
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={{ height: 22 }} />
          <SectionLabel>Identity</SectionLabel>
          <FieldInput
            label="Business Name"
            value={draft.businessName}
            onChangeText={(v) => set({ businessName: v })}
            autoCapitalize="words"
          />

          <SectionLabel>Trade</SectionLabel>
          <View style={styles.tradeGrid}>
            {TRADE_PRESETS.map((t) => {
              const sel = draft.trade === t.id;
              return (
                <PressableScale
                  key={t.id}
                  onPress={() => set({ trade: t.id })}
                  style={[styles.tradeChip, sel ? styles.tradeChipSel : null]}
                >
                  <Text style={[styles.tradeChipText, sel ? styles.tradeChipTextSel : null]}>{t.label}</Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={{ height: 22 }} />
          <SectionLabel>Contact</SectionLabel>
          <FieldInput
            label="Phone"
            value={draft.phone}
            onChangeText={(v) => set({ phone: formatPhone(v) })}
            keyboardType="phone-pad"
            placeholder="(555) 555-5555"
            maxLength={14}
          />
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 2 }}>
              <FieldInput label="City" value={draft.city} onChangeText={(v) => set({ city: v })} autoCapitalize="words" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <FieldInput
                label="State"
                value={draft.state}
                onChangeText={(v) => set({ state: v.toUpperCase().slice(0, 2) })}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>
          <FieldInput label="Website" value={draft.website} onChangeText={(v) => set({ website: v })} keyboardType="url" />
          <FieldInput
            label="Google Review Link"
            value={draft.googleReviewLink}
            onChangeText={(v) => set({ googleReviewLink: v })}
            keyboardType="url"
          />

          <View style={{ height: 22 }} />
          <SectionLabel>Services offered</SectionLabel>
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

          <View style={{ height: 28 }} />
          <PrimaryButton label="Save profile" onPress={save} />
          <View style={{ height: 220 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22 },
  logoBox: {
    width: 90, height: 90, borderRadius: 14, overflow: "hidden",
    backgroundColor: Colors.navyDeep,
    borderWidth: 1, borderColor: Colors.hairline,
  },
  logoEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  tradeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  tradeChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.navySurface,
    borderColor: Colors.hairlineSoft, borderWidth: 1,
  },
  tradeChipSel: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  tradeChipText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  tradeChipTextSel: { color: Colors.navyDeep },
  serviceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
    backgroundColor: Colors.navySurface,
    borderColor: Colors.hairlineSoft, borderWidth: 1,
    flexDirection: "row", gap: 6, alignItems: "center",
  },
  serviceChipOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  serviceText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  serviceTextOn: { color: Colors.navyDeep },
});
