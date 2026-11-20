import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "../api";
import { colors, fonts } from "../theme";
import {
  Avatar,
  Button,
  Card,
  Display,
  ErrorText,
  Field,
  Ionicons,
  LoadingScreen,
  Muted,
  Row,
  Screen,
} from "../ui";
import { generateDeviceKey, saveDisplayName, usePublicKey } from "../wallet";

export default function WalletScreen() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    api("/v1/me")
      .then((data) => {
        setUser(data.user);
        setName(data.user.hasName ? data.user.displayName : "");
      })
      .catch((err) => setError(err.message));
  }, []);
  useFocusEffect(load);

  async function saveName() {
    setError("");
    setNote("");
    setBusy("name");
    try {
      const next = await saveDisplayName(name.trim());
      setUser(next);
      setName(next.hasName ? next.displayName : "");
      setNote("Display name saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function pasteKey() {
    setError("");
    setNote("");
    setBusy("paste");
    try {
      const next = await usePublicKey(pasted);
      setUser(next);
      setPasted("");
      setNote("Wallet updated. This session was signed in again.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function generate() {
    setError("");
    setNote("");
    setBusy("generate");
    try {
      const next = await generateDeviceKey();
      setUser(next);
      setNote("New device key saved. This account is signed in as that key.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (!user && !error) return <LoadingScreen />;

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Display size={34}>Wallet</Display>
        <Muted>The public key and name other people in your circles see.</Muted>
      </View>
      {user ? (
        <Card>
          <Row gap={12} align="flex-start">
            <Avatar name={user.displayName} seed={user.walletPubkey} size={48} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.bodySemi, fontSize: 16 }}>
                {user.hasName ? user.displayName : "No display name yet."}
              </Text>
              <Text selectable style={{ color: colors.muted, fontFamily: fonts.body, fontSize: 13 }}>
                {user.walletPubkey}
              </Text>
            </View>
          </Row>
          <Field
            label="Display name"
            value={name}
            onChangeText={setName}
            placeholder="What should your circle call you?"
            autoCapitalize="words"
          />
          <Button
            label="Save display name"
            icon="checkmark"
            onPress={saveName}
            loading={busy === "name"}
            disabled={Boolean(busy) || name.trim().length < 1}
          />
        </Card>
      ) : null}
      <Card tone="raised">
        <Row gap={10}>
          <Ionicons name="key-outline" size={18} color={colors.accent} />
          <Text style={{ color: colors.text, fontFamily: fonts.displayMedium, fontSize: 17, flex: 1 }}>Change wallet</Text>
        </Row>
        <Field
          label="Public key"
          value={pasted}
          onChangeText={setPasted}
          placeholder="Paste a Solana public key"
          autoCapitalize="none"
        />
        <Button
          label="Use this public key"
          icon="enter-outline"
          tone="secondary"
          onPress={pasteKey}
          loading={busy === "paste"}
          disabled={Boolean(busy) || pasted.trim().length < 32}
        />
        <Button
          label="Generate a new device key"
          icon="refresh"
          tone="secondary"
          onPress={generate}
          loading={busy === "generate"}
          disabled={Boolean(busy)}
        />
        <Muted>
          Phantom, Solflare, and Backpack are the wallets on a phone build (Wallet Adapter in the browser, Mobile
          Wallet Adapter on Android). This web preview keeps an ed25519 key on the device instead of an extension.
          Generating a new key signs this account in again. Pasting a public key switches the address and refreshes
          your session.
        </Muted>
      </Card>
      {note ? (
        <Row gap={8} align="flex-start">
          <Ionicons name="checkmark-circle" size={16} color={colors.win} />
          <Muted style={{ color: colors.win, flex: 1 }}>{note}</Muted>
        </Row>
      ) : null}
      <ErrorText onDismiss={() => setError("")}>{error}</ErrorText>
    </Screen>
  );
}
