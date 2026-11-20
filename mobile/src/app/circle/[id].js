import { useCallback, useState } from "react";
import { Platform, Share, Text, View } from "react-native";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../api";
import { amount } from "../../format";
import { colors, fonts, radius, space } from "../../theme";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  Chip,
  Display,
  EmptyState,
  ErrorText,
  Field,
  H2,
  Ionicons,
  LoadingScreen,
  Money,
  Muted,
  Row,
  Screen,
  SectionHeader,
  StatusBadge,
  Tap,
} from "../../ui";

const goalIdeas = ["Gym before noon", "10k steps a day", "Read 20 pages", "No phone after 11pm", "Cook at home"];
const stakeOptions = ["1", "5", "10", "25"];

const roleTone = { owner: "accent", judge: "info", member: "neutral" };

function BetRow({ bet }) {
  const pot = bet.stakeAmount * bet.participantCount;
  return (
    <Card onPress={() => router.push(`/bet/${bet.id}`)}>
      <Row justify="space-between" align="flex-start">
        <View style={{ flex: 1, gap: 6 }}>
          <StatusBadge status={bet.status} />
          <Text style={{ color: colors.text, fontFamily: fonts.displayMedium, fontSize: 18 }} numberOfLines={2}>
            {bet.title}
          </Text>
          <Muted style={{ fontSize: 13 }}>
            {bet.betType === "head_to_head" ? "Head to head" : "Pool"} · {bet.participantCount} in ·{" "}
            {amount(bet.stakeAmount)} USDC each
          </Muted>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={{ color: colors.faint, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1 }}>POT</Text>
          <Money value={amount(pot)} size={24} unit="" color={bet.status === "active" ? colors.accent : colors.text} />
        </View>
      </Row>
    </Card>
  );
}

export default function CircleScreen() {
  const { id } = useLocalSearchParams();
  const [circle, setCircle] = useState(null);
  const [me, setMe] = useState(null);
  const [title, setTitle] = useState(goalIdeas[0]);
  const [stake, setStake] = useState("5");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [composing, setComposing] = useState(false);

  const load = useCallback(() => {
    api(`/v1/circles/${id}`)
      .then((data) => setCircle(data.circle))
      .catch((err) => setError(err.message));
    api("/v1/me")
      .then((data) => setMe(data.user))
      .catch((err) => setError(err.message));
  }, [id]);
  useFocusEffect(load);

  async function shareCode() {
    const message = `Join my circle "${circle.name}" on Ante with code ${circle.inviteCode}`;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(circle.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } else {
        await Share.share({ message });
      }
    } catch {
      // The person closed the share sheet or the clipboard is blocked.
    }
  }

  async function addPartner() {
    setError("");
    try {
      await api(`/v1/circles/${id}/practice-partner`, { method: "POST" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createBet() {
    if (!circle) return;
    const partner = circle.members.find((member) => member.user.practice);
    if (!partner || !me) {
      setError("Add a practice partner, or have a friend join from their device, before opening a bet.");
      return;
    }
    const stakeAmount = Math.round(Number(stake) * 1_000_000);
    if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
      setError("Enter a stake in USDC.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { bet } = await api(`/v1/circles/${id}/bets`, {
        method: "POST",
        json: {
          title,
          betType: "head_to_head",
          stakeAmount,
          proofsRequired: 1,
          periodHours: 24 * 7,
          participantIds: [me.id, partner.user.id],
        },
      });
      setComposing(false);
      router.push(`/bet/${bet.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!circle) return <LoadingScreen error={error} />;

  const hasPartner = circle.members.some((member) => member.user.practice);
  const live = circle.bets.filter((bet) => bet.status === "active");
  const past = circle.bets.filter((bet) => bet.status !== "active");
  const stakeNumber = Number(stake) || 0;

  return (
    <Screen>
      <Stack.Screen options={{ title: circle.name }} />

      <View style={{ gap: space.md }}>
        <AvatarStack users={circle.members.map((m) => m.user)} size={34} max={6} />
        <Display size={34}>{circle.name}</Display>
        <Row gap={10} style={{ flexWrap: "wrap" }}>
          <Tap onPress={shareCode} style={codeChip}>
            <Text style={{ color: colors.faint, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1 }}>
              INVITE
            </Text>
            <Text style={{ color: colors.text, fontFamily: fonts.display, fontSize: 16, letterSpacing: 2 }}>
              {circle.inviteCode}
            </Text>
            <Ionicons
              name={copied ? "checkmark" : Platform.OS === "web" ? "copy-outline" : "share-outline"}
              size={15}
              color={copied ? colors.win : colors.muted}
            />
          </Tap>
          <Tap onPress={() => router.push(`/leaderboard/${id}`)} style={codeChip}>
            <Ionicons name="trophy" size={15} color={colors.warn} />
            <Text style={{ color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 }}>Leaderboard</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.faint} />
          </Tap>
        </Row>
      </View>

      {composing ? (
        <Card tone="raised" style={{ borderColor: colors.lineStrong }}>
          <Row justify="space-between">
            <H2>New habit bet</H2>
            <Tap onPress={() => setComposing(false)}>
              <Ionicons name="close" size={20} color={colors.muted} />
            </Tap>
          </Row>
          <Muted>Head to head. Post one photo during the week to make it. Miss it and your stake goes to them.</Muted>

          <Field label="The habit" value={title} onChangeText={setTitle} placeholder="What are you committing to?" />
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            {goalIdeas.map((idea) => (
              <Chip key={idea} label={idea} selected={title === idea} onPress={() => setTitle(idea)} />
            ))}
          </Row>

          <Text style={{ color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13, marginTop: 4 }}>
            Your stake
          </Text>
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            {stakeOptions.map((option) => (
              <Chip key={option} label={`$${option}`} selected={stake === option} onPress={() => setStake(option)} />
            ))}
          </Row>
          <Field
            value={stake}
            onChangeText={setStake}
            placeholder="Custom amount"
            keyboardType="decimal-pad"
            prefix="$"
            suffix="USDC"
          />

          <View style={potBox}>
            <View>
              <Text style={{ color: colors.faint, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1 }}>
                WINNER TAKES
              </Text>
              <Money value={(stakeNumber * 2).toFixed(stakeNumber % 1 ? 2 : 0)} size={28} color={colors.accent} />
            </View>
            <Muted style={{ fontSize: 13, textAlign: "right", flex: 1 }}>7 days{"\n"}1 photo to make it</Muted>
          </View>

          {!hasPartner ? (
            <Muted style={{ fontSize: 13, color: colors.warn }}>
              You need an opponent. Add a practice partner below, or have a friend join with the invite code.
            </Muted>
          ) : null}
          <Button label="Ante up" icon="flash" onPress={createBet} loading={busy} disabled={!title.trim()} />
        </Card>
      ) : (
        <Button label="New bet" icon="add" onPress={() => setComposing(true)} />
      )}

      <ErrorText onDismiss={() => setError("")}>{error}</ErrorText>

      <SectionHeader title="Live bets" count={live.length} />
      {live.length === 0 ? (
        <EmptyState icon="flash-outline" title="Nothing on the line" body="Open a bet and give your circle something to watch." />
      ) : (
        live.map((bet) => <BetRow key={bet.id} bet={bet} />)
      )}

      <SectionHeader title="People" count={circle.members.length} />
      <Card padded={false}>
        {circle.members.map((member, index) => (
          <Row
            key={member.user.id}
            gap={12}
            style={{
              paddingHorizontal: space.lg,
              paddingVertical: 12,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: colors.line,
            }}
          >
            <Avatar name={member.user.displayName} seed={member.user.walletPubkey} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.bodySemi, fontSize: 15 }}>
                {member.user.displayName}
                {me && member.user.id === me.id ? <Text style={{ color: colors.faint }}> (you)</Text> : null}
              </Text>
              {member.user.practice && member.user.displayName !== "Practice partner" ? (
                <Muted style={{ fontSize: 12 }}>Practice partner</Muted>
              ) : null}
            </View>
            <Row gap={6}>
              {(member.roles.length > 1 ? member.roles.filter((r) => r !== "member") : member.roles).map((role) => (
                <Badge key={role} label={role[0].toUpperCase() + role.slice(1)} tone={roleTone[role] ?? "neutral"} />
              ))}
            </Row>
          </Row>
        ))}
        {!hasPartner && circle.roles?.includes("owner") ? (
          <View style={{ padding: space.md, borderTopWidth: 1, borderTopColor: colors.line }}>
            <Button label="Add a practice partner" icon="person-add-outline" tone="secondary" size="sm" onPress={addPartner} />
          </View>
        ) : null}
      </Card>

      {past.length > 0 ? (
        <>
          <SectionHeader title="Settled" count={past.length} />
          {past.map((bet) => (
            <BetRow key={bet.id} bet={bet} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const codeChip = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  paddingHorizontal: 14,
  paddingVertical: 10,
  borderRadius: radius.pill,
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
};

const potBox = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: space.lg,
  borderRadius: radius.md,
  backgroundColor: colors.bg,
  borderWidth: 1,
  borderColor: colors.line,
};
