import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Stack, router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import {
  ImagePlus,
  LayoutGrid,
  MapPin,
  Rows,
  Share2,
  Sparkles,
  Square,
} from "lucide-react-native";
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
import { generateBeforeAfterCaption } from "@/lib/ai";
import { saveImagesToLibrary, shareImage } from "@/lib/share";
import { useApp } from "@/providers/AppProvider";
import type { CompositeLayout } from "@/types";

const LAYOUTS: { id: CompositeLayout; label: string; icon: React.ReactNode }[] = [
  { id: "side-by-side", label: "Side", icon: <LayoutGrid size={18} color={Colors.white} /> },
  { id: "stacked", label: "Stack", icon: <Rows size={18} color={Colors.white} /> },
  { id: "before-only", label: "Before", icon: <Square size={18} color={Colors.white} /> },
  { id: "after-only", label: "After", icon: <Square size={18} color={Colors.white} /> },
];

export default function BeforeAfterScreen() {
  const { profile, addPost } = useApp();
  const [service, setService] = useState<string>(profile.services[0] ?? "");
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [layout, setLayout] = useState<CompositeLayout>("side-by-side");
  const [caption, setCaption] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [jobLocation, setJobLocation] = useState<string>("");
  const shotRef = useRef<ViewShot>(null);
  const afterShotRef = useRef<ViewShot>(null);

  const pick = async (slot: "before" | "after", source: "library" | "camera") => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    };
    const r =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (!r.canceled && r.assets[0]) {
      const uri = r.assets[0].uri;
      if (slot === "before") setBefore(uri);
      else setAfter(uri);
    }
  };

  const generate = async () => {
    if (!service) {
      Alert.alert("Pick a service first");
      return;
    }
    if (!before && !after) {
      Alert.alert("Add at least one photo");
      return;
    }
    setLoading(true);
    try {
      const text = await generateBeforeAfterCaption({
        businessName: profile.businessName,
        city: profile.city,
        state: profile.state,
        phone: profile.phone,
        website: profile.website,
        service,
        notes,
        jobLocation: jobLocation.trim() || undefined,
      });
      setCaption(text);
    } catch (e) {
      console.log("[ba] caption error", e);
      Alert.alert("Couldn't generate caption", "Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    if (!shotRef.current?.capture) return;
    setSharing(true);
    try {
      const uri = await shotRef.current.capture();

      // When the user shares a Before-only branded post, they almost always
      // want both Before AND After in the same Facebook/Instagram post. Save
      // the branded After to the gallery so they can attach it from the
      // native composer right after the share sheet opens.
      let savedAfter = false;
      if (layout === "before-only" && after && afterShotRef.current?.capture) {
        try {
          const afterUri = await afterShotRef.current.capture();
          const res = await saveImagesToLibrary([afterUri]);
          savedAfter = res.saved > 0;
          if (res.denied) {
            Alert.alert(
              "Save the After photo",
              "Allow Photos access so EZ Post can save the branded After image. You can then attach it alongside the Before in your post."
            );
          }
        } catch (err) {
          console.log("[ba] auto-save after error", err);
        }
      }

      if (caption) await Clipboard.setStringAsync(caption);
      await shareImage(uri, caption);
      await addPost({
        id: `ba-${Date.now()}`,
        kind: "before-after",
        createdAt: Date.now(),
        imageUri: uri,
        caption,
        meta: { service, layout },
        source: {
          beforeUri: before,
          afterUri: after,
          service,
          layout,
          profile,
        },
      });
      if (savedAfter) {
        setTimeout(() => {
          Alert.alert(
            "After photo saved",
            "Your branded After image was saved to your gallery. In Facebook/Instagram, tap the photo button again and add it from your camera roll to post Before + After together."
          );
        }, 600);
      }
    } catch (e) {
      console.log("[ba] share error", e);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Before / After" }} />
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
          <SectionLabel>Step 1 — Service</SectionLabel>
          <View style={styles.serviceWrap}>
            {(profile.services.length ? profile.services : ["House Washing"]).map((s) => {
              const on = service === s;
              return (
                <PressableScale
                  key={s}
                  onPress={() => setService(s)}
                  style={[styles.serviceChip, on ? styles.serviceChipOn : null]}
                >
                  <Text style={[styles.serviceText, on ? styles.serviceTextOn : null]}>{s}</Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={{ height: 18 }} />
          <SectionLabel>Step 2 — Photos</SectionLabel>
          <View style={styles.photoRow}>
            <PhotoSlot uri={before} label="BEFORE" onPick={(src) => pick("before", src)} />
            <PhotoSlot uri={after} label="AFTER" onPick={(src) => pick("after", src)} />
          </View>

          <View style={{ height: 18 }} />
          <SectionLabel>Step 3 — Layout</SectionLabel>
          <View style={styles.layoutRow}>
            {LAYOUTS.map((l) => {
              const on = layout === l.id;
              return (
                <PressableScale
                  key={l.id}
                  onPress={() => setLayout(l.id)}
                  style={[styles.layoutBtn, on ? styles.layoutBtnOn : null]}
                >
                  {l.icon}
                  <Text style={[styles.layoutLabel, on ? { color: Colors.navyDeep } : null]}>{l.label}</Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={{ height: 18 }} />
          <SectionLabel>Preview</SectionLabel>
          <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95, result: "tmpfile" }}>
            <PostComposite layout={layout} beforeUri={before} afterUri={after} service={service} profile={profile} />
          </ViewShot>

          {/* Hidden render of the branded After-only composite, captured
              silently when sharing a Before-only post so both images can be
              attached to the same social post. */}
          {layout === "before-only" && after ? (
            <View style={styles.offscreen} pointerEvents="none">
              <ViewShot ref={afterShotRef} options={{ format: "png", quality: 0.95, result: "tmpfile" }}>
                <PostComposite layout="after-only" beforeUri={before} afterUri={after} service={service} profile={profile} />
              </ViewShot>
            </View>
          ) : null}

          <View style={{ height: 18 }} />
          <SectionLabel>Job location (optional)</SectionLabel>
          <View style={styles.locRow}>
            <MapPin size={16} color={Colors.gold} />
            <TextInput
              placeholder={profile.city ? `${profile.city}${profile.state ? `, ${profile.state}` : ""}` : "City or neighborhood"}
              placeholderTextColor={Colors.textMuted}
              value={jobLocation}
              onChangeText={setJobLocation}
              style={styles.locInput}
              autoCapitalize="words"
            />
          </View>
          <Body muted style={{ marginTop: 6, fontSize: 12 } as never}>
            Leave blank to use your business city. Set this when the job is in a different town.
          </Body>

          <View style={{ height: 18 }} />
          <SectionLabel>Notes for AI (optional)</SectionLabel>
          <TextInput
            placeholder="e.g. heavy moss on north side, two-story home, took 4 hours"
            placeholderTextColor={Colors.textMuted}
            multiline
            value={notes}
            onChangeText={setNotes}
            style={styles.notes}
          />

          <View style={{ height: 14 }} />
          <PrimaryButton
            label={caption ? "Regenerate caption" : "Generate caption with AI"}
            icon={<Sparkles size={18} color={Colors.navyDeep} />}
            onPress={generate}
            loading={loading}
          />

          {caption ? (
            <>
              <View style={{ height: 18 }} />
              <SectionLabel>Caption</SectionLabel>
              <TextInput
                multiline
                value={caption}
                onChangeText={setCaption}
                style={[styles.notes, { minHeight: 160 }]}
              />
              <View style={{ height: 14 }} />
              <PrimaryButton
                label={sharing ? "Sharing..." : "Share branded post"}
                icon={<Share2 size={18} color={Colors.navyDeep} />}
                onPress={share}
                loading={sharing}
              />
              {layout === "before-only" && after ? (
                <Body muted style={{ marginTop: 10, fontSize: 12, lineHeight: 17 } as never}>
                  Sharing the Before will also save your branded After to your gallery so you can attach both to the same post.
                </Body>
              ) : null}
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

function PhotoSlot({
  uri,
  label,
  onPick,
}: {
  uri: string | null;
  label: string;
  onPick: (src: "library" | "camera") => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        onPress={() =>
          Alert.alert(label, undefined, [
            { text: "Camera", onPress: () => onPick("camera") },
            { text: "Library", onPress: () => onPick("library") },
            { text: "Cancel", style: "cancel" },
          ])
        }
        style={styles.slot}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.slotEmpty}>
            <ImagePlus size={26} color={Colors.gold} />
            <Text style={styles.slotLabel}>{label}</Text>
            <Text style={styles.slotHint}>Tap to add</Text>
          </View>
        )}
        <View style={styles.slotTag}>
          <Text style={styles.slotTagText}>{label}</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22 },
  serviceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  serviceChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.navySurface,
    borderColor: Colors.hairlineSoft, borderWidth: 1,
  },
  serviceChipOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  serviceText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
  serviceTextOn: { color: Colors.navyDeep },
  photoRow: { flexDirection: "row", gap: 12 },
  slot: {
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Colors.navySurface,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  slotEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  slotLabel: { color: Colors.gold, fontWeight: "800", fontSize: 12, letterSpacing: 1.6 },
  slotHint: { color: Colors.textMuted, fontSize: 11 },
  slotTag: {
    position: "absolute", bottom: 8, left: 8,
    backgroundColor: Colors.navyDeep,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1, borderColor: Colors.gold,
  },
  slotTagText: { color: Colors.gold, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  layoutRow: { flexDirection: "row", gap: 8 },
  layoutBtn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.navySurface,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    gap: 4,
  },
  layoutBtnOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  layoutLabel: { color: Colors.white, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.navyDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    paddingHorizontal: 14,
  },
  locInput: {
    flex: 1,
    height: 50,
    color: Colors.white,
    fontSize: 15,
  },
  notes: {
    backgroundColor: Colors.navyDeep,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    padding: 14,
    color: Colors.white,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  offscreen: {
    position: "absolute",
    left: -10000,
    top: 0,
    opacity: 0,
  },
});
