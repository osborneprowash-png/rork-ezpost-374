import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as MailComposer from "expo-mail-composer";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import * as SMS from "expo-sms";
import { Alert, Linking, Platform, Share } from "react-native";

/**
 * Share an image (file URI) plus a caption via the native share sheet.
 * Falls back gracefully on web.
 */
export async function shareImage(uri: string, caption: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      await Clipboard.setStringAsync(caption);
      Alert.alert("Caption copied", "Image saved to file. Caption copied to clipboard.");
      return;
    }
    const can = await Sharing.isAvailableAsync();
    if (can) {
      await Clipboard.setStringAsync(caption);
      await Sharing.shareAsync(uri, {
        dialogTitle: "Share post",
        mimeType: "image/png",
        UTI: "public.png",
      });
      return;
    }
    await Share.share({ url: uri, message: caption });
  } catch (e) {
    console.log("[share] error", e);
  }
}

export async function copyText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}

export type SmsResult = { ok: boolean; savedToGallery: boolean };

export async function sendReviewRequestSMS(message: string, imageUri?: string): Promise<SmsResult> {
  try {
    const isAvail = await SMS.isAvailableAsync();
    if (!isAvail) return { ok: false, savedToGallery: false };
  } catch (e) {
    console.log("[sms] availability check failed", e);
    return { ok: false, savedToGallery: false };
  }

  const normalizedUri = imageUri
    ? imageUri.startsWith("file://") || imageUri.startsWith("content://")
      ? imageUri
      : `file://${imageUri}`
    : undefined;

  // Always save the branded image to the gallery first so the user can
  // attach it manually if Android (or the carrier) strips the attachment.
  let savedToGallery = false;
  if (normalizedUri) {
    const res = await saveImagesToLibrary([normalizedUri]);
    savedToGallery = res.saved > 0;
  }

  if (normalizedUri) {
    try {
      await SMS.sendSMSAsync([], message, {
        attachments: [{ uri: normalizedUri, mimeType: "image/png", filename: "before-after.png" }],
      });
      return { ok: true, savedToGallery };
    } catch (e) {
      console.log("[sms] attachment send failed, falling back to text-only", e);
      try {
        await SMS.sendSMSAsync([], message);
        return { ok: true, savedToGallery };
      } catch (e2) {
        console.log("[sms] text-only send failed", e2);
        return { ok: false, savedToGallery };
      }
    }
  }

  try {
    await SMS.sendSMSAsync([], message);
    return { ok: true, savedToGallery };
  } catch (e) {
    console.log("[sms] send failed", e);
    return { ok: false, savedToGallery };
  }
}

export async function sendReviewRequestEmail(subject: string, body: string, imageUri?: string): Promise<boolean> {
  const isAvail = await MailComposer.isAvailableAsync();
  if (!isAvail) return false;
  await MailComposer.composeAsync({
    subject,
    body,
    attachments: imageUri ? [imageUri] : undefined,
  });
  return true;
}

/** Make sure FileSystem is referenced so tree-shake doesn't drop it; useful later for caching. */
export const _fsTouch = FileSystem;

/**
 * Share several images one after another via the native share sheet.
 * iOS/Android only support sharing one URI at a time, so we loop.
 */
export async function shareImagesSequential(uris: string[], caption?: string): Promise<void> {
  if (Platform.OS === "web") {
    if (caption) await Clipboard.setStringAsync(caption);
    Alert.alert("Sharing not supported on web", "Use the mobile app to share photos.");
    return;
  }
  const can = await Sharing.isAvailableAsync();
  if (!can) {
    if (caption) await Clipboard.setStringAsync(caption);
    Alert.alert("Sharing unavailable");
    return;
  }
  if (caption) await Clipboard.setStringAsync(caption);
  for (const uri of uris) {
    if (!uri) continue;
    try {
      await Sharing.shareAsync(uri, { dialogTitle: "Share photo", mimeType: "image/png", UTI: "public.png" });
    } catch (e) {
      console.log("[share] sequential error", e);
      break;
    }
  }
}

/**
 * Save one or more images to the user's camera roll so they can pick multiple
 * when posting from Facebook / Instagram natively.
 */
export async function saveImagesToLibrary(
  uris: string[]
): Promise<{ saved: number; denied: boolean; error?: string }> {
  if (Platform.OS === "web") return { saved: 0, denied: false, error: "web" };

  const current = await MediaLibrary.getPermissionsAsync().catch(() => null);
  let granted = current?.granted ?? false;
  if (!granted) {
    const req = await MediaLibrary.requestPermissionsAsync(true).catch(() => null);
    granted = req?.granted ?? false;
  }
  if (!granted) return { saved: 0, denied: true };

  let saved = 0;
  let lastError: string | undefined;
  for (const uri of uris) {
    if (!uri) continue;
    try {
      const fileUri =
        uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("ph://")
          ? uri
          : `file://${uri}`;
      try {
        await MediaLibrary.createAssetAsync(fileUri);
      } catch (innerErr) {
        await MediaLibrary.saveToLibraryAsync(fileUri);
      }
      saved += 1;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.log("[share] save error", e);
    }
  }
  return { saved, denied: false, error: saved === 0 ? lastError : undefined };
}

/**
 * Open the user's mail client (or fall back to a mailto link) prefilled with
 * a beta-feedback message.
 */
export async function sendBetaFeedback(): Promise<void> {
  const to = "feedback@ezpost.app";
  const version = Constants.expoConfig?.version ?? "dev";
  const platform = `${Platform.OS} ${Platform.Version}`;
  const subject = `EZ Post beta feedback (v${version})`;
  const body = [
    "Tell us what you love, what's broken, or what's missing.",
    "",
    "---",
    `App version: ${version}`,
    `Platform: ${platform}`,
  ].join("\n");

  const canMail = await MailComposer.isAvailableAsync().catch(() => false);
  if (canMail) {
    await MailComposer.composeAsync({ recipients: [to], subject, body });
    return;
  }
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const can = await Linking.canOpenURL(url);
  if (can) {
    await Linking.openURL(url);
  } else {
    await Clipboard.setStringAsync(`${to}\n\n${subject}\n\n${body}`);
    Alert.alert("Email copied", `Send your feedback to ${to}. The email body has been copied to your clipboard.`);
  }
}
