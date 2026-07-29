import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Quote, Star } from "lucide-react-native";
import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";
import { formatPhone } from "@/lib/format";
import type { BusinessProfile } from "@/types";

export type ReviewTemplate = "classic" | "minimal";

type Props = {
  template: ReviewTemplate;
  reviewer: string;
  reviewText: string;
  profile: BusinessProfile;
};

export const ReviewComposite = forwardRef<View, Props>(({ template, reviewer, reviewText, profile }, ref) => {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <LinearGradient
        colors={template === "minimal" ? [Colors.white, Colors.offWhite] : [Colors.navyDeep, Colors.navy]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {template === "classic" && (
        <View style={styles.body}>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={28} color={Colors.gold} fill={Colors.gold} />
            ))}
          </View>
          <Quote size={36} color={Colors.gold} style={{ marginTop: 18, opacity: 0.5 }} />
          <Text style={styles.reviewText} numberOfLines={10}>
            "{reviewText}"
          </Text>
          <Text style={styles.reviewer}>— {reviewer || "Happy Customer"}</Text>
          <View style={{ flex: 1 }} />
          <BrandFooter profile={profile} />
        </View>
      )}

{template === "minimal" && (
        <View style={styles.body}>
          <Text style={[styles.reviewerStacked, { color: Colors.navy }]}>
            {reviewer || "Happy Customer"}
          </Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={26} color={Colors.gold} fill={Colors.gold} />
            ))}
          </View>
          <Text style={[styles.reviewText, { color: Colors.navyDeep }]} numberOfLines={12}>
            "{reviewText}"
          </Text>
          <View style={{ flex: 1 }} />
          <BrandFooter profile={profile} dark />
        </View>
      )}
    </View>
  );
});
ReviewComposite.displayName = "ReviewComposite";

function BrandFooter({ profile, dark }: { profile: BusinessProfile; dark?: boolean }) {
  return (
    <View>
      <View style={[styles.footerDivider, dark ? { backgroundColor: Colors.gold } : null]} />
      <View style={styles.footerRow}>
        {profile.logoUri ? (
          <Image source={{ uri: profile.logoUri }} style={styles.fLogo} contentFit="contain" />
        ) : (
          <View style={styles.fLogoFallback}>
            <Text style={styles.fLogoFallbackText}>{(profile.businessName || "EZ").slice(0, 2).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.fName, dark ? { color: Colors.navyDeep } : null]} numberOfLines={1}>
            {profile.businessName || "Your Business"}
          </Text>
          <Text style={[styles.fSub, dark ? { color: Colors.navy } : null]} numberOfLines={1}>
            {formatPhone(profile.phone) || profile.phone}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    aspectRatio: 1080 / 1350,
    overflow: "hidden",
    borderRadius: 12,
  },
  body: {
    flex: 1,
    padding: 28,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
  },
  reviewText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "500",
    marginTop: 14,
  },
  reviewer: {
    color: Colors.gold,
    fontSize: 14,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginTop: 16,
  },
  reviewerStacked: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: "800",
    marginVertical: 12,
    letterSpacing: -0.3,
  },
  topBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 14,
  },
  topBadgeText: {
    color: Colors.navyDeep,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  dividerThin: {
    height: 1,
    backgroundColor: Colors.hairline,
    marginVertical: 6,
  },
  footerDivider: {
    height: 2,
    backgroundColor: Colors.gold,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fLogo: { width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.white },
  fLogoFallback: {
    width: 44, height: 44, borderRadius: 8, backgroundColor: Colors.gold,
    alignItems: "center", justifyContent: "center",
  },
  fLogoFallbackText: { color: Colors.navyDeep, fontWeight: "900", fontSize: 15 },
  fName: { color: Colors.white, fontSize: 15, fontWeight: "800" },
  fSub: { color: Colors.textSecondary, fontSize: 11, marginTop: 2, fontWeight: "600" },
});
