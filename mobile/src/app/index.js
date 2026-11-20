import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { api } from "../api";
import { getToken } from "../session";
import { colors, fonts, radius, space } from "../theme";
import { Badge, Body, Button, Display, ErrorText, Ionicons, Muted, Row, Screen } from "../ui";
import { signInWithDeviceKey } from "../wallet";
import { Wordmark } from "../brand";

const steps = [
  { icon: "people", title: "Start a circle", body: "Your friends: the people who see your proof and can call you out." },
  { icon: "lock-closed", title: "Ante up", body: "Everyone locks USDC. A Solana program holds the pot, not us." },
  { icon: "camera", title: "Prove it", body: "Post a photo before the deadline. Follow through and you take the pot." },
];

export default function Welcome() {
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  async function enter() {
    if (!adult) {
      setError("Ante is for people 18 and older.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let user = null;
      if (await getToken()) {
        try {
          user = (await api("/v1/me")).user;
        } catch {
          user = null;
        }
      }
      if (!user) user = await signInWithDeviceKey();
      if (!user.ageConfirmed) {
        await api("/v1/me/age", { method: "POST", json: { confirmed: true } });
      }
      router.replace("/circles");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={{ paddingTop: 56, gap: space.xl }}>
      <Row justify="space-between">
        <Wordmark />
        <Badge label="Devnet" tone="warn" dot />
      </Row>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        <Display size={46}>
          Put money{"\n"}on your <Text style={{ color: colors.accent }}>habits.</Text>
        </Display>
        <Body style={{ color: colors.muted, fontSize: 17, lineHeight: 25 }}>
          Lock USDC with friends. Post the photo. Whoever follows through takes the pot.
        </Body>
      </View>

      <View style={styles.steps}>
        {steps.map((step, index) => (
          <View key={step.title} style={[styles.step, index < steps.length - 1 && styles.stepDivider]}>
            <View style={styles.stepIcon}>
              <Ionicons name={step.icon} size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Muted>{step.body}</Muted>
            </View>
          </View>
        ))}
      </View>

      <View style={{ gap: space.md }}>
        <Pressable
          onPress={() => {
            setAdult((value) => !value);
            setError("");
          }}
          style={[styles.consent, adult && { borderColor: "rgba(198,255,61,0.4)" }]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: adult }}
        >
          <View style={[styles.box, adult && styles.boxOn]}>
            {adult ? <Ionicons name="checkmark" size={15} color={colors.accentInk} /> : null}
          </View>
          <Text style={styles.consentText}>
            I'm 18 or older. This is a commitment between friends, not a house game.
          </Text>
        </Pressable>

        <Button
          label={busy ? "Signing in…" : "Get started"}
          icon={busy ? undefined : "arrow-forward"}
          loading={busy}
          onPress={enter}
        />
        <ErrorText>{error}</ErrorText>
      </View>

      <View style={{ gap: space.sm }}>
        <Pressable onPress={() => setShowDetails((v) => !v)}>
          <Row gap={6}>
            <Ionicons name="key-outline" size={14} color={colors.faint} />
            <Text style={styles.detailsToggle}>How sign-in works in this preview</Text>
            <Ionicons name={showDetails ? "chevron-up" : "chevron-down"} size={14} color={colors.faint} />
          </Row>
        </Pressable>
        {showDetails ? (
          <Muted style={{ fontSize: 13, lineHeight: 19, color: colors.faint }}>
            Phantom, Solflare, and Backpack are the wallets for a phone build through the Solana Wallet Adapter and
            Mobile Wallet Adapter. This browser preview keeps an ed25519 key on the device so you can sign in. You pay
            your own network fee. Ante does not sponsor SOL.
          </Muted>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
  },
  step: { flexDirection: "row", gap: 14, paddingVertical: space.lg, alignItems: "flex-start" },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 15 },
  consent: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  consentText: { color: colors.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, flex: 1 },
  detailsToggle: { color: colors.faint, fontFamily: fonts.bodyMedium, fontSize: 13 },
});
