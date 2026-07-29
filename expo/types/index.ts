export type BusinessProfile = {
  businessName: string;
  phone: string;
  website: string;
  googleReviewLink: string;
  city: string;
  state: string;
  logoUri: string | null;
  trade: string;
  services: string[];
};

export type CompositeLayout = "side-by-side" | "stacked" | "before-only" | "after-only";

export type SavedPost = {
  id: string;
  kind: "before-after" | "review" | "request";
  createdAt: number;
  imageUri?: string;
  caption?: string;
  meta?: Record<string, string>;
  /** Source data needed to re-render the post in any layout from History. */
  source?: {
    beforeUri?: string | null;
    afterUri?: string | null;
    service?: string;
    layout?: CompositeLayout;
    profile?: BusinessProfile;
  };
};
