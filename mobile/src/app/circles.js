import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";
import { api } from "../api";
import { Wordmark } from "../brand";
import { amount, shortKey } from "../format";
import { avatarColor, colors, fonts, radius, space } from "../theme";
import {
  Avatar,
  Badge,
  Body,
  Button,
  Card,
  Display,
  EmptyState,
  ErrorText,
  Field,
  Ionicons,
  Muted,
  Row,
  Screen,
  SectionHeader,
  Segmented,
  Skeleton,
} from "../ui";

function CircleCard({ circle }) {
  const tint = avatarColor(circle.id);
  return (
    <Card onPress={() => router.push(`/circle/${circle.id}`)}>
      <Row gap={14}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: radius.md,
            backgroundColor: tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: fonts.display, fontSize: 20, color: "#0B0B0D" }}>
            {circle.name.trim().charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Row gap={8}>
            <Text
              style={{ color: colors.text, fontFamily: fonts.displayMedium, fontSize: 18, flexShrink: 1 }}
              numberOfLines={1}
            >
              {circle.name}
            </Text>
            {circle.roles?.includes("owner") ? <Badge label="Owner" tone="accent" /> : null}
          </Row>
          <Muted style={{ fontSize: 13 }} numberOfLines={1}>
            {amount(circle.defaultStake)} USDC default · Code {circle.inviteCode}
          </Muted>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </Row>
    </Card>
  );
}

export default function Circles() {
  const [circles, setCircles] = useState(null);
  const [me, setMe] = useState(null);
  const [mode, setMode] = useState("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return Promise.all([
      api("/v1/circles").then((data) => setCircles(data.circles)),
      api("/v1/me").then((data) => setMe(data.user)),
    ]).catch((err) => setError(err.message));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function create() {
    setError("");
    setBusy(true);
    try {
      const { circle } = await api("/v1/circles", { method: "POST", json: { name } });
      setName("");
      router.push(`/circle/${circle.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    setError("");
    setBusy(true);
    try {
      const { circle } = await api("/v1/circles/join", {
        method: "POST",
        json: { code: code.trim().toUpperCase() },
      });
      setCode("");
      router.push(`/circle/${circle.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={refresh}>
      <Stack.Screen
        options={{
          headerTitle: () => <Wordmark size={18} />,
          headerRight: () =>
            me ? (
              <Row gap={8} style={{ marginRight: 4 }}>
                <Text style={{ color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13 }}>
                  {shortKey(me.walletPubkey)}
                </Text>
                <Avatar name={me.displayName} seed={me.walletPubkey} size={28} />
              </Row>
            ) : null,
        }}
      />

      <View style={{ gap: 6, marginTop: space.sm }}>
        <Muted>{me ? `Hey, ${me.displayName}` : " "}</Muted>
        <Display size={34}>Your circles</Display>
      </View>
      <Body style={{ color: colors.muted }}>The people who see your proof, and can call you out on it.</Body>

      {circles === null ? (
        <>
          <Skeleton height={80} />
          <Skeleton height={80} />
        </>
      ) : circles.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No circles yet"
          body="Start one for your group chat, or join a friend's with their invite code."
        />
      ) : (
        circles.map((circle) => <CircleCard key={circle.id} circle={circle} />)
      )}

      <SectionHeader title={mode === "create" ? "Start a circle" : "Join a circle"} />
      <Card>
        <Segmented
          value={mode}
          onChange={(value) => {
            setMode(value);
            setError("");
          }}
          options={[
            { value: "create", label: "Create", icon: "add" },
            { value: "join", label: "Join", icon: "enter-outline" },
          ]}
        />
        {mode === "create" ? (
          <>
            <Field
              label="Circle name"
              value={name}
              onChangeText={setName}
              placeholder="Roommates, Run club, The group chat…"
              onSubmitEditing={() => name.trim().length >= 2 && create()}
            />
            <Button
              label="Create circle"
              icon="add-circle"
              onPress={create}
              loading={busy}
              disabled={name.trim().length < 2}
            />
          </>
        ) : (
          <>
            <Field
              label="Invite code"
              value={code}
              onChangeText={setCode}
              placeholder="ABC234"
              autoCapitalize="characters"
              style={{ letterSpacing: 2 }}
              onSubmitEditing={() => code.trim() && join()}
            />
            <Button
              label="Join circle"
              icon="enter"
              onPress={join}
              loading={busy}
              disabled={code.trim().length < 4}
            />
          </>
        )}
      </Card>
      <ErrorText onDismiss={() => setError("")}>{error}</ErrorText>
    </Screen>
  );
}
