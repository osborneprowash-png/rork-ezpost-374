import { Image } from "expo-image";
import { LayoutGrid, Rows, Square, Trash2 } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { PostComposite } from "@/components/PostComposite";
import { Body, H1, PressableScale, PrimaryButton, Screen, SectionLabel } from "@/components/ui";
import Colors from "@/constants/colors";
import { saveImagesToLibrary, shareImage } from "@/lib/share";
import { useApp } from "@/providers/AppProvider";
import type { CompositeLayout, SavedPost } from "@/types";

const LAYOUTS: { id: CompositeLayout; label: string; icon: React.ReactNode }[] = [
  { id: "side-by-side", label: "Side", icon: <LayoutGrid size={16} color={Colors.white} /> },
  { id: "stacked", label: "Stack", icon: <Rows size={16} color={Colors.white} /> },
  { id: "before-only", label: "Before", icon: <Square size={16} color={Colors.white} /> },
  { id: "after-only", label: "After", icon: <Square size={16} color={Colors.white} /> },
];

export default function HistoryTab() {
  const { posts, removePost } = useApp();

  return (
    <Screen>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>YOUR POSTS</Text>
          <H1>History</H1>

          <View style={{ height: 22 }} />

          {posts.length === 0 ? (
            <View style={styles.empty}>
              <Body muted>No posts yet. Your generated graphics will live here.</Body>
            </View>
          ) : (
            posts.map((p) => <HistoryCard key={p.id} post={p} onDelete={() => removePost(p.id)} />)
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

function HistoryCard({ post, onDelete }: { post: SavedPost; onDelete: () => void }) {
  const canRelayout =
    post.kind === "before-after" &&
    !!post.source &&
    !!post.source.profile &&
    (!!post.source.beforeUri || !!post.source.afterUri);

  const initialLayout: CompositeLayout =
    (post.source?.layout as CompositeLayout) ?? "side-by-side";
  const [layout, setLayout] = useState<CompositeLayout>(initialLayout);
  const [sharing, setSharing] = useState<boolean>(false);
  const shotRef = useRef<ViewShot>(null);
  const afterShotRef = useRef<ViewShot>(null);

  const availableLayouts = LAYOUTS.filter((l) => {
    if (!post.source) return true;
    if (l.id === "before-only") return !!post.source.beforeUri;
    if (l.id === "after-only") return !!post.source.afterUri;
    return !!post.source.beforeUri && !!post.source.afterUri;
  });

  const shareCurrent = async () => {
    if (canRelayout && shotRef.current?.capture) {
      setSharing(true);
      try {
        const uri = await shotRef.current.capture();
        if (layout === "before-only" && post.source?.afterUri && afterShotRef.current?.capture) {
          try {
            const afterUri = await afterShotRef.current.capture();
            const res = await saveImagesToLibrary([afterUri]);
            if (res.denied) {
              Alert.alert(
                "Save the After photo",
                "Allow Photos access so EZ Post can save the branded After image."
              );
            }
          } catch (e) {
            console.log("[history] after capture err", e);
          }
        }
        await shareImage(uri, post.caption ?? "");
      } catch (e) {
        console.log("[history] re-share err", e);
      } finally {
        setSharing(false);
      }
    } else if (post.imageUri) {
      await shareImage(post.imageUri, post.caption ?? "");
    }
  };

  return (
    <View style={styles.card}>
      {canRelayout && post.source ? (
        <ViewShot ref={shotRef} options={{ format: "png", quality: 0.95, result: "tmpfile" }}>
          <PostComposite
            layout={layout}
            beforeUri={post.source.beforeUri ?? null}
            afterUri={post.source.afterUri ?? null}
            service={post.source.service ?? ""}
            profile={post.source.profile!}
          />
        </ViewShot>
      ) : post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.thumb} contentFit="cover" />
      ) : null}

      {canRelayout && layout === "before-only" && post.source?.afterUri ? (
        <View style={styles.offscreen} pointerEvents="none">
          <ViewShot ref={afterShotRef} options={{ format: "png", quality: 0.95, result: "tmpfile" }}>
            <PostComposite
              layout="after-only"
              beforeUri={post.source.beforeUri ?? null}
              afterUri={post.source.afterUri ?? null}
              service={post.source.service ?? ""}
              profile={post.source.profile!}
            />
          </ViewShot>
        </View>
      ) : null}

      <View style={{ padding: 14, gap: 10 }}>
        <SectionLabel>
          {post.kind === "before-after" ? "Before / After" : post.kind === "review" ? "5-Star Review" : "Review Request"}
        </SectionLabel>
        <Body muted>{new Date(post.createdAt).toLocaleString()}</Body>
        {post.caption ? (
          <Text style={styles.caption} numberOfLines={4}>{post.caption}</Text>
        ) : null}

        {canRelayout ? (
          <View style={styles.layoutRow}>
            {availableLayouts.map((l) => {
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
        ) : null}

        <View style={styles.row}>
          {(canRelayout || post.imageUri) ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label={sharing ? "Sharing..." : canRelayout ? "Share this layout" : "Share again"}
                onPress={shareCurrent}
                loading={sharing}
              />
            </View>
          ) : null}
          <PressableScale
            onPress={() => {
              Alert.alert("Delete post?", "", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: onDelete },
              ]);
            }}
            style={styles.deleteBtn}
          >
            <Trash2 size={18} color={Colors.danger} />
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 22, paddingTop: 8 },
  kicker: { color: Colors.gold, fontSize: 11, letterSpacing: 2.4, fontWeight: "800", marginBottom: 8 },
  empty: {
    backgroundColor: Colors.navySurface,
    borderRadius: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    alignItems: "center",
  },
  card: {
    backgroundColor: Colors.navySurface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
  },
  thumb: { width: "100%", aspectRatio: 1080 / 1350, backgroundColor: Colors.navyDeep },
  caption: { color: Colors.white, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  deleteBtn: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: "rgba(226,107,92,0.1)",
    borderColor: "rgba(226,107,92,0.4)", borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  layoutRow: { flexDirection: "row", gap: 6 },
  layoutBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.navyDeep,
    borderWidth: 1,
    borderColor: Colors.hairlineSoft,
    flexDirection: "row",
    gap: 4,
  },
  layoutBtnOn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  layoutLabel: { color: Colors.white, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  offscreen: { position: "absolute", left: -10000, top: 0, opacity: 0 },
});
