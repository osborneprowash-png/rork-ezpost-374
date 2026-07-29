import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BusinessProfile, SavedPost } from "@/types";

const PROFILE_KEY = "ezpost.profile.v1";
const POSTS_KEY = "ezpost.posts.v1";

const EMPTY_PROFILE: BusinessProfile = {
  businessName: "",
  phone: "",
  website: "",
  googleReviewLink: "",
  city: "",
  state: "",
  logoUri: null,
  trade: "pressure-washing",
  services: [],
};

export const [AppProvider, useApp] = createContextHook(() => {
  const [profile, setProfile] = useState<BusinessProfile>(EMPTY_PROFILE);
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, ps] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(POSTS_KEY),
        ]);
        if (p) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(p) });
        if (ps) setPosts(JSON.parse(ps));
      } catch (e) {
        console.log("[app] hydrate error", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const saveProfile = useCallback(async (next: BusinessProfile) => {
    setProfile(next);
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch (e) {
      console.log("[app] save profile error", e);
    }
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<BusinessProfile>) => {
      const next = { ...profile, ...patch };
      await saveProfile(next);
    },
    [profile, saveProfile]
  );

  const addPost = useCallback(async (post: SavedPost) => {
    setPosts((prev) => {
      const next = [post, ...prev].slice(0, 50);
      AsyncStorage.setItem(POSTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removePost = useCallback(async (id: string) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      AsyncStorage.setItem(POSTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isProfileComplete = useMemo<boolean>(() => {
    return (
      profile.businessName.trim().length > 0 &&
      profile.phone.trim().length > 0 &&
      profile.city.trim().length > 0 &&
      profile.state.trim().length > 0
    );
  }, [profile]);

  return useMemo(
    () => ({
      profile,
      posts,
      hydrated,
      isProfileComplete,
      saveProfile,
      updateProfile,
      addPost,
      removePost,
    }),
    [profile, posts, hydrated, isProfileComplete, saveProfile, updateProfile, addPost, removePost]
  );
});
