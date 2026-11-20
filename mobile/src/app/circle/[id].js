import { useCallback, useEffect, useState } from "react";
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

const PERIODS = [
  { id: "5m", label: "5 minutes", minutes: 5 },
  { id: "1d", label: "1 day", minutes: 24 * 60 },
  { id: "3d", label: "3 days", minutes: 3 * 24 * 60 },
  { id: "1w", label: "1 week", minutes: 7 * 24 * 60 },
  { id: "2w", label: "2 weeks", minutes: 14 * 24 * 60 },
  { id: "custom", label: "Custom days", minutes: null },
];

const DISPUTE_WINDOWS = [
  { id: "5m", label: "5 minutes (demo)", minutes: 5 },
  { id: "1d", label: "1 day", minutes: 24 * 60 },
  { id: "3d", label: "3 days", minutes: 3 * 24 * 60 },
];

const roleTone = { owner: "accent", judge: "info", member: "neutral" };

function moneyLabel(value) {
  if (!Number.isFinite(value)) return "0";
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}

function periodBlurb(periodId, customDays) {
  if (periodId === "custom") {
    const days = Number(customDays);
    if (Number.isInteger(days) && days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
    return "Custom length";
  }
  return PERIODS.find((period) => period.id === periodId)?.label ?? "";
}

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
  const [periodId, setPeriodId] = useState("1w");
  const [customDays, setCustomDays] = useState("10");
  const [windowId, setWindowId] = useState("1d");
  const [picked, setPicked] = useState(null);
  const [kind, setKind] = useState("head_to_head");
  const [judgeIds, setJudgeIds] = useState([]);
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

  useEffect(() => {
    if (!circle || !me || picked) return;
    const partner = circle.members.find((member) => member.user.practice);
    setPicked(partner ? [me.id, partner.user.id] : [me.id]);
  }, [circle, me, picked]);

  const selected = picked ?? (me ? [me.id] : []);
  const practiceCount = circle?.members.filter((member) => member.user.practice).length ?? 0;

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

  function togglePerson(userId) {
    if (!me || userId === me.id) return;
    const base = me && !selected.includes(me.id) ? [me.id, ...selected] : selected;
    if (!base.includes(userId) && base.length >= 10) {
      setError("A pool can include at most 10 people.");
      return;
    }
    setError("");
    setPicked(base.includes(userId) ? base.filter((item) => item !== userId) : [...base, userId]);
    setJudgeIds((current) => current.filter((item) => item !== userId));
  }

  function toggleJudge(userId) {
    setError("");
    setJudgeIds((current) => (current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId]));
  }

  async function createBet() {
    if (!circle || !me) return;
    const participantIds = [...new Set([me.id, ...selected])];
    if (participantIds.length < 2) {
      setError("Pick at least two people. Add a practice partner if you are demoing from one device.");
      return;
    }
    if (participantIds.length > 10) {
      setError("A pool can include at most 10 people.");
      return;
    }
    const judges = judgeIds.filter((userId) => !participantIds.includes(userId));
    if (judges.length === 2 || judges.length > 3) {
      setError("Assign one or three judges, or leave judges unset.");
      return;
    }
    let periodMinutes = PERIODS.find((period) => period.id === periodId)?.minutes;
    if (periodId === "custom") {
      const days = Number(customDays);
      if (!Number.isInteger(days) || days < 1 || days > 90) {
        setError("Custom length is a whole number of days from 1 to 90.");
        return;
      }
      periodMinutes = days * 24 * 60;
    }
    const stakeAmount = Math.round(Number(stake) * 1_000_000);
    if (!Number.isFinite(stakeAmount) || stakeAmount <= 0) {
      setError("Enter a stake in USDC.");
      return;
    }
    const betType = participantIds.length === 2 ? kind : "pool";
    const disputeWindowMinutes = DISPUTE_WINDOWS.find((item) => item.id === windowId)?.minutes ?? 24 * 60;
    setError("");
    setBusy(true);
    try {
      const { bet } = await api(`/v1/circles/${id}/bets`, {
        method: "POST",
        json: {
          title,
          betType,
          stakeAmount,
          proofsRequired: 1,
          periodMinutes,
          disputeWindowMinutes,
          participantIds,
          judgeIds: judges,
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

  const live = circle.bets.filter((bet) => bet.status === "active");
  const review = circle.bets.filter((bet) => bet.status === "resolved" || bet.status === "disputed");
  const past = circle.bets.filter((bet) => bet.status !== "active" && bet.status !== "resolved" && bet.status !== "disputed");
  const stakeNumber = Number(stake) || 0;
  const peopleIn = selected.length;
  const winnerTakes = peopleIn === 2 && kind === "head_to_head";
  const outsiders = circle.members.filter((member) => !selected.includes(member.user.id));
  const isOwner = circle.roles?.includes("owner");

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
          <Muted>Pick who is in and how long it lasts. Head to head is two people. A pool is two to ten. One photo makes it.</Muted>

          <Field label="The habit" value={title} onChangeText={setTitle} placeholder="What are you committing to?" />
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            {goalIdeas.map((idea) => (
              <Chip key={idea} label={idea} selected={title === idea} onPress={() => setTitle(idea)} />
            ))}
          </Row>

          <Text style={labelStyle}>Your stake</Text>
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

          <Text style={labelStyle}>Who is in</Text>
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            {circle.members.map((member) => {
              const locked = member.user.id === me?.id;
              const practice = member.user.practice ? " · practice" : "";
              return (
                <Chip
                  key={member.user.id}
                  label={`${member.user.displayName}${practice}${locked ? " · you" : ""}`}
                  selected={selected.includes(member.user.id)}
                  onPress={() => togglePerson(member.user.id)}
                />
              );
            })}
          </Row>
          {peopleIn === 2 ? (
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              <Chip label="Head to head" selected={kind === "head_to_head"} onPress={() => setKind("head_to_head")} />
              <Chip label="Pool" selected={kind === "pool"} onPress={() => setKind("pool")} />
            </Row>
          ) : (
            <Muted style={{ fontSize: 13 }}>{peopleIn > 2 ? "Pool bet, two to ten people." : "Pick one more person."}</Muted>
          )}

          <Text style={labelStyle}>Period</Text>
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            {PERIODS.map((period) => (
              <Chip
                key={period.id}
                label={period.label}
                selected={periodId === period.id}
                onPress={() => setPeriodId(period.id)}
              />
            ))}
          </Row>
          {periodId === "custom" ? (
            <Field value={customDays} onChangeText={setCustomDays} placeholder="Days" keyboardType="number-pad" suffix="days" />
          ) : null}

          <Text style={labelStyle}>Dispute window</Text>
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            {DISPUTE_WINDOWS.map((item) => (
              <Chip
                key={item.id}
                label={item.label}
                selected={windowId === item.id}
                onPress={() => setWindowId(item.id)}
              />
            ))}
          </Row>

          <Muted style={{ fontSize: 13 }}>
            Judges are optional. Pick one or three people who are not in the bet. Leave this unset and the other circle
            members vote. On one device, leave a practice partner out and cast their vote from the bet screen.
          </Muted>
          {outsiders.length === 0 ? (
            <Muted style={{ fontSize: 13 }}>Everyone is in the bet. Add a practice partner if you want a voter.</Muted>
          ) : (
            <Row gap={8} style={{ flexWrap: "wrap" }}>
              {outsiders.map((member) => (
                <Chip
                  key={member.user.id}
                  label={`${member.user.displayName} · judge`}
                  selected={judgeIds.includes(member.user.id)}
                  onPress={() => toggleJudge(member.user.id)}
                />
              ))}
            </Row>
          )}

          <View style={potBox}>
            <View>
              <Text style={{ color: colors.faint, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1 }}>
                {winnerTakes ? "WINNER TAKES" : "POT"}
              </Text>
              <Money value={moneyLabel(stakeNumber * peopleIn)} size={28} color={colors.accent} />
            </View>
            <Muted style={{ fontSize: 13, textAlign: "right", flex: 1 }}>
              {periodBlurb(periodId, customDays)}
              {"\n"}1 photo to make it
            </Muted>
          </View>

          {peopleIn < 2 ? (
            <Muted style={{ fontSize: 13, color: colors.warn }}>
              You need an opponent. Add a practice partner below, or have a friend join with the invite code.
            </Muted>
          ) : null}
          <Button label="Ante up" icon="flash" onPress={createBet} loading={busy} disabled={!title.trim() || peopleIn < 2} />
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

      {review.length > 0 ? (
        <>
          <SectionHeader title="In review" count={review.length} />
          {review.map((bet) => (
            <BetRow key={bet.id} bet={bet} />
          ))}
        </>
      ) : null}

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
        {isOwner ? (
          <View style={{ padding: space.md, borderTopWidth: 1, borderTopColor: colors.line, gap: 8 }}>
            <Button
              label={practiceCount === 0 ? "Add a practice partner" : "Add another practice partner"}
              icon="person-add-outline"
              tone="secondary"
              size="sm"
              onPress={addPartner}
              disabled={practiceCount >= 9}
            />
            {practiceCount >= 9 ? (
              <Muted style={{ fontSize: 12 }}>This circle has 9 practice partners, the cap for a 10-person pool.</Muted>
            ) : null}
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

const labelStyle = { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13, marginTop: 4 };

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
