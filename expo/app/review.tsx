import { router } from "expo-router";
import { Copy, Reply, Share2, Sparkles } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { ReviewComposite, type ReviewTemplate } from "@/components/ReviewComposite";
import {
  Body,
  GhostButton,
  PressableScale,
  PrimaryButton,
  Screen,
  SectionLabel,
} from "@/components/ui";
import Colors from "@/constants/colors";
import { generateGoogleReplyToReview, generateReviewPostCaption } from "@/lib/ai";
import { copyText, shareImage } from "@/lib/share";
import { useApp } from "@/providers/AppProvider";

const TEMPLATES: { id: ReviewTemplate; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Light" },
];

export default function ReviewScreen() {
  const { profile, addPost } = useApp();
  const [reviewer, setReviewer] = useState<string>("");
  const [reviewText, setReviewText] = useState<string>("");
  const [template, setTemplate] = useState<ReviewTemplate>("classic");
  const [caption, setCaption] = useState<string>("");
  const [reply, setReply] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);
  const [service, setService] = useState<string>(profile.services[0] ?? "");
  const shotRef = useRef<ViewShot>(null);

  const generate = async () => {
    if (!reviewText.trim() || !reviewer.trim()) {
      Alert.alert("Missing info", "Add the reviewer name and review text.");
      return;
    }
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        generateReviewPostCaption({
          businessName: profile.businessName,
          city: profile.city,
          state: profile.state,
          reviewer,
          reviewText,
        }),
        generateGoogleReplyToReview({
          businessName: profile.businessName,
          city: profile.city,
          state: profile.state,
          service: service || profile.services[0] || "our service",
          reviewer,
          reviewText,
        }),
      ]);
      setCaption(c);
      setReply(r);
    } catch (e) {
      console.log("[review] error", e);
      Alert.alert("Couldn't generate", "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    if (!shotRef.current?.capture) return;
    setSharing(true);
    try {
      const uri = await shotRef.current.capture();
      await shareImage(uri, caption);
      await addPost({
        id: `rev-${Date.now()}`,
        kind: "review",
        createdAt: Date.now(),
        imageUri: uri,
        caption,
        meta: { reviewer, template },
      });
    } catch (e) {
      console.log("[review] share error", e);
    } finally {
      setSharing(false);
    }
  };

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
          <SectionLabel>Reviewer</SectionLabel>
          <TextInput
            placeholder="First name or 'John D.'"
            placeholderTextColor={Colors.textMuted}
            value={reviewer}
            onChangeText={setReviewer}
            style={styles.input}
            autoCapitalize="words"
          />
          <View style={{ height: 14 }} />

          <SectionLabel>Review</SectionLabel>
          <TextInput
            placeholder="Paste the customer review here..."
            placeholderTextColor={Colors.textMuted}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            style={[styles.input, { minHeight: 120 }]}
          />
          <View style={{ height: 14 }} />

          {profile.services.length > 0 && (
            <>
              <SectionLabel>Service for the Google reply</SectionLabel>
              <View style={styles.chipWrap}>
                {profile.services.map((s) => {
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
              <View style={{ height: 14 }} />
            </>
          )}

          <SectionLabel>Template</SectionLabel>
          <View style={styles.templateRow}>
            {TEMPLATES.map((t) => {
              const on = template === t.id;
              return (
                <PressableScale
                  key={t.id}
                  onPress={() => setTemplate(t.id)}
                  style={[styles.templateBtn, on ? styles.templateBtnOn : null]}
                >
                  <Text style={[styles.templateText, on ? { color: Colors.navyDeep } : null]}>{t.label}</Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={{ height: 14 }} />
          <SectionLabel>Preview</SectionLabel>
          <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95, result: "tmpfile" }}>
            <ReviewComposite
              template={template}
              reviewer={reviewer}
              reviewText={reviewText || "Your review will appear here..."}
              profile={profile}
            />
          </ViewShot>

          <View style={{ height: 18 }} />
          <PrimaryButton
            label={caption ? "Regenerate" : "Generate caption + Google reply"}
            icon={<Sparkles size={18} color={Colors.navyDeep} />}
            onPress={generate}
            loading={loading}
          />

          {caption ? (
            <>
              <View style={{ height: 18 }} />
              <SectionLabel>Social caption</SectionLabel>
              <TextInput
                multiline value={caption} onChangeText={setCaption}
                style={[styles.input, { minHeight: 130 }]}
              />
              <View style={{ height: 14 }} />
              <PrimaryButton
                label={sharing ? "Sharing..." : "Share graphic + caption"}
                icon={<Share2 size={18} color={Colors.navyDeep} />}
                onPress={share}
                loading={sharing}
              />
            </>
          ) : null}

          {reply ? (
            <>
              <View style={{ height: 22 }} />
              <SectionLabel>Google reply (post on the review)</SectionLabel>
              <TextInput
                multiline value={reply} onChangeText={setReply}
                style={[styles.input, { minHeight: 130 }]}
              />
              <View style={{ height: 12 }} />
              <GhostButton
                label="Copy reply to clipboard"
                icon={<Copy size={16} color={Colors.white} />}
                onPress={async () => {
                  await copyText(reply);
                  Alert.alert("Copied", "Paste it as your Google reply.");
                }}
              />
            </>
          ) : null}

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
    minHeight: 50,
    textAlignVertical: "top",
  },
  templateRow: { flexDirection: "row", gap: 8 },
  templateBtn: {
    flex: 1, height: 50, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.navySurface,
    borderWidth: 1, borderColor: Colors.hairlineSoft,
  },
  templateBtnOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  templateText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.navySurface, borderWidth: 1, borderColor: Colors.hairlineSoft,
  },
  chipOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  chipTextOn: { color: Colors.navyDeep },
});
