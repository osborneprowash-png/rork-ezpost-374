import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Copy, ImagePlus, Mail, MessageSquare } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { PostComposite } from "@/components/PostComposite";
import {
  Body,
  GhostButton,
  PressableScale,
  PrimaryButton,
  Screen,
  SectionLabel,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { formatPhone } from "@/lib/format";
import {
  copyText,
  sendReviewRequestEmail,
  sendReviewRequestSMS,
} from "@/lib/share";
import { useApp } from "@/providers/AppProvider";

export default function ReviewRequestScreen() {
  const { profile, addPost } = useApp();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [customer, setCustomer] = useState<string>("");
  const [service, setService] = useState<string>(profile.services[0] ?? "your service");
  const shotRef = useRef<ViewShot>(null);

  const buildMessage = (): string => {
    const intro = customer.trim() ? `Hey ${customer.trim()},` : "Hey,";
    const link = profile.googleReviewLink
      ? `\n\nIf you have 30 seconds, would you mind dropping us a quick Google review? Means the world for a small business.\n${profile.googleReviewLink}`
      : "\n\nIf you have 30 seconds, would you mind leaving us a quick Google review? Means the world for a small business.";
    const phone = profile.phone ? formatPhone(profile.phone) : "";
    return `${intro}\n\nThanks again for letting ${profile.businessName || "us"} handle your ${service.toLowerCase()}. We loved seeing the before/after on this one.${link}\n\n— ${profile.businessName || ""}${phone ? `\n${phone}` : ""}`;
  };

  const pick = async (slot: "before" | "after") => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!r.canceled && r.assets[0]) {
      if (slot === "before") setBefore(r.assets[0].uri);
      else setAfter(r.assets[0].uri);
    }
  };

  const captureImage = async (): Promise<string | undefined> => {
    if (!shotRef.current?.capture) return undefined;
    return shotRef.current.capture();
  };

  const sendSms = async () => {
    const uri = await captureImage();
    const res = await sendReviewRequestSMS(buildMessage(), uri);
    if (!res.ok) {
      Alert.alert("SMS not available on this device.");
      return;
    }
    if (uri) {
      await addPost({ id: `req-${Date.now()}`, kind: "request", createdAt: Date.now(), imageUri: uri, caption: buildMessage() });
    }
    if (res.savedToGallery) {
      Alert.alert(
        "Image saved to gallery",
        "If your phone blocks the photo in the SMS, tap the attach button and pick the saved image from your gallery."
      );
    }
  };

  const sendEmail = async () => {
    const uri = await captureImage();
    const ok = await sendReviewRequestEmail(`Quick favor from ${profile.businessName}`, buildMessage(), uri);
    if (!ok) Alert.alert("Email not available on this device.");
    if (uri) {
      await addPost({ id: `req-${Date.now()}`, kind: "request", createdAt: Date.now(), imageUri: uri, caption: buildMessage() });
    }
  };

  const copyAll = async () => {
    await copyText(buildMessage());
    Alert.alert("Copied", "Paste it into your messaging app.");
  };

  const ready = (before || after) && profile.businessName;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          <Body muted>Send your customer the before/after with a friendly nudge to leave a Google review.</Body>

          <View style={{ height: 18 }} />
          <SectionLabel>Customer name (optional)</SectionLabel>
          <TextInput
            placeholder="First name"
            placeholderTextColor={Colors.textMuted}
            value={customer}
            onChangeText={setCustomer}
            autoCapitalize="words"
            style={styles.input}
          />

          <View style={{ height: 14 }} />
          <SectionLabel>Service performed</SectionLabel>
          <View style={styles.chipWrap}>
            {(profile.services.length ? profile.services : ["Our work"]).map((s) => {
              const on = service === s;
              return (
                <PressableScale
                  key={s}
                  onPress={() => setService(s)}
                  style={[styles.chip, on ? styles.chipOn : null]}
                >
                  <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>{s}</Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={{ height: 18 }} />
          <SectionLabel>Photos</SectionLabel>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable onPress={() => pick("before")} style={styles.slot}>
              {before ? (
                <Image source={{ uri: before }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={styles.slotEmpty}>
                  <ImagePlus size={22} color={Colors.gold} />
                  <Text style={styles.slotLabel}>BEFORE</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => pick("after")} style={styles.slot}>
              {after ? (
                <Image source={{ uri: after }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <View style={styles.slotEmpty}>
                  <ImagePlus size={22} color={Colors.gold} />
                  <Text style={styles.slotLabel}>AFTER</Text>
                </View>
              )}
            </Pressable>
          </View>

          <View style={{ height: 18 }} />
          <SectionLabel>Preview</SectionLabel>
          <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95, result: "tmpfile" }}>
            <PostComposite layout="side-by-side" beforeUri={before} afterUri={after} service={service} profile={profile} />
          </ViewShot>

          <View style={{ height: 18 }} />
          <SectionLabel>Message preview</SectionLabel>
          <View style={styles.msgBox}>
            <Text style={styles.msgText}>{buildMessage()}</Text>
          </View>

          {!profile.googleReviewLink ? (
            <View style={styles.warn}>
              <Text style={styles.warnText}>
                Add your Google review link in Business Profile to include it automatically.
              </Text>
            </View>
          ) : null}

          <View style={{ height: 18 }} />
          <PrimaryButton
            label="Send via SMS"
            icon={<MessageSquare size={18} color={Colors.navyDeep} />}
            onPress={sendSms}
            disabled={!ready}
          />
          <View style={{ height: 10 }} />
          <PrimaryButton
            label="Send via Email"
            icon={<Mail size={18} color={Colors.navyDeep} />}
            onPress={sendEmail}
            disabled={!ready}
          />
          <View style={{ height: 10 }} />
          <GhostButton label="Copy message" icon={<Copy size={16} color={Colors.white} />} onPress={copyAll} />
          <View style={{ height: 12 }} />
          <GhostButton label="Cancel" onPress={() => router.back()} />
          <View style={{ height: 220 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22 },
  input: {
    backgroundColor: Colors.navyDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    padding: 14,
    color: Colors.white,
    fontSize: 14,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.navySurface, borderWidth: 1, borderColor: Colors.hairlineSoft,
  },
  chipOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  chipTextOn: { color: Colors.navyDeep },
  slot: {
    flex: 1, aspectRatio: 1, borderRadius: 14, overflow: "hidden",
    backgroundColor: Colors.navySurface,
    borderWidth: 1, borderColor: Colors.hairline,
  },
  slotEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  slotLabel: { color: Colors.gold, fontWeight: "800", fontSize: 12, letterSpacing: 1.6 },
  msgBox: {
    backgroundColor: Colors.navyDeep,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
  },
  msgText: { color: Colors.white, fontSize: 13, lineHeight: 19 },
  warn: {
    marginTop: 12,
    backgroundColor: "rgba(201,168,76,0.12)",
    borderColor: Colors.hairline,
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  warnText: { color: Colors.gold, fontSize: 12, fontWeight: "700" },
});
