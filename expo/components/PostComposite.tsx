import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Phone, Globe } from "lucide-react-native";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { formatPhone } from "@/lib/format";
import type { BusinessProfile, CompositeLayout } from "@/types";

const CARD_W = 1080;
const CARD_H = 1350; // 4:5 portrait social

type Props = {
  layout: CompositeLayout;
  beforeUri?: string | null;
  afterUri?: string | null;
  service: string;
  profile: BusinessProfile;
};

/**
 * Renders a branded before/after composite card.
 * Designed to be captured via react-native-view-shot.
 * The container is sized for the on-screen preview; capture at result: 'png' for export.
 */
export const PostComposite = forwardRef<View, Props>(({ layout, beforeUri, afterUri, service, profile }, ref) => {
  const showBefore = layout === "side-by-side" || layout === "stacked" || layout === "before-only";
  const showAfter = layout === "side-by-side" || layout === "stacked" || layout === "after-only";

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      {/* navy background */}
      <LinearGradient
        colors={[Colors.navyDeep, Colors.navy]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* image area */}
      <View style={styles.imageArea}>
        {layout === "side-by-side" && (
          <View style={styles.row}>
            <ImagePane uri={beforeUri} label="BEFORE" />
            <View style={styles.divider} />
            <ImagePane uri={afterUri} label="AFTER" />
          </View>
        )}
        {layout === "stacked" && (
          <View style={styles.col}>
            <ImagePane uri={beforeUri} label="BEFORE" />
            <View style={[styles.divider, { width: "100%", height: 6 }]} />
            <ImagePane uri={afterUri} label="AFTER" />
          </View>
        )}
        {layout === "before-only" && <ImagePane uri={beforeUri} label="BEFORE" />}
        {layout === "after-only" && <ImagePane uri={afterUri} label="AFTER" />}

        {!showBefore && !showAfter ? null : null}
      </View>

      {/* footer brand bar */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          {profile.logoUri ? (
            <Image source={{ uri: profile.logoUri }} style={styles.logo} contentFit="contain" />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoFallbackText}>{(profile.businessName || "EZ").slice(0, 2).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.brandName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
              {profile.businessName || "Your Business"}
            </Text>
            {service ? (
              <Text style={styles.brandService} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
                {service.toUpperCase()}
              </Text>
            ) : null}
          </View>
        </View>
        {(profile.phone || profile.website) ? (
          <View style={styles.contactBar}>
            {!!profile.phone && (
              <View style={styles.contactRow}>
                <Phone size={13} color={Colors.gold} />
                <Text style={styles.contactText} numberOfLines={1}>{formatPhone(profile.phone) || profile.phone}</Text>
              </View>
            )}
            {!!profile.website && (
              <View style={[styles.contactRow, { flexShrink: 1 }]}>
                <Globe size={13} color={Colors.gold} />
                <Text style={styles.contactText} numberOfLines={1}>{stripUrl(profile.website)}</Text>
              </View>
            )}
          </View>
        ) : null}
        <View style={styles.goldBar} />
      </View>
    </View>
  );
});
PostComposite.displayName = "PostComposite";

function ImagePane({ uri, label }: { uri?: string | null; label: string }) {
  return (
    <View style={styles.pane}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
      <View style={styles.tag}>
        <Text style={styles.tagText}>{label}</Text>
      </View>
    </View>
  );
}

function stripUrl(u: string): string {
  return u.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: CARD_W / CARD_H,
    backgroundColor: Colors.navyDeep,
    overflow: "hidden",
    borderRadius: 12,
  },
  imageArea: {
    flex: 1,
    margin: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.navySurface,
  },
  row: { flex: 1, flexDirection: "row" },
  col: { flex: 1, flexDirection: "column" },
  pane: { flex: 1, backgroundColor: Colors.navy, overflow: "hidden" },
  divider: { width: 6, backgroundColor: Colors.gold },
  placeholder: {
    backgroundColor: Colors.navySurface,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: "700",
  },
  tag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: Colors.navyDeep,
    borderColor: Colors.gold,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  tagText: {
    color: Colors.gold,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800",
  },
  footer: {
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  footerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  contactBar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 14,
    paddingBottom: 10,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  logoFallback: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  logoFallbackText: {
    color: Colors.navyDeep,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  brandName: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
    lineHeight: 19,
  },
  brandService: {
    color: Colors.gold,
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginTop: 3,
    lineHeight: 14,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "600",
  },
  goldBar: {
    height: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
});
