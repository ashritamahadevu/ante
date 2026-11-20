import { useCallback, useState } from "react";
import { Image, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { api, API_URL, photoUrl } from "../../api";
import { getToken } from "../../session";
import { amount, periodProgress, timeAgo, timeLeft } from "../../format";
import { colors, fonts, radius, space } from "../../theme";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Display,
  EmptyState,
  ErrorText,
  Field,
  IconButton,
  Ionicons,
  LoadingScreen,
  Money,
  Muted,
  OutcomeBadge,
  ProgressBar,
  Row,
  Screen,
  SectionHeader,
  StatusBadge,
  Tap,
} from "../../ui";

function ReactionChip({ icon, label, count, active, tone, onPress }) {
  const color = tone === "loss" ? colors.loss : colors.accent;
  return (
    <Tap
      onPress={onPress}
      scale={0.94}
      style={[
        styles.reaction,
        active && { borderColor: color, backgroundColor: tone === "loss" ? colors.lossSoft : colors.accentSoft },
      ]}
    >
      <Ionicons name={icon} size={15} color={active ? color : colors.muted} />
      <Text style={[styles.reactionText, active && { color }]}>{label}</Text>
      {count > 0 ? <Text style={[styles.reactionCount, active && { color }]}>{count}</Text> : null}
    </Tap>
  );
}

function Contender({ participant, proofs, required, isMe }) {
  const done = Math.min(proofs, required);
  return (
    <View style={styles.contender}>
      <Avatar name={participant.user.displayName} seed={participant.user.walletPubkey} size={56} />
      <Text style={styles.contenderName} numberOfLines={1}>
        {participant.user.displayName}
        {isMe ? <Text style={{ color: colors.faint }}> (you)</Text> : null}
      </Text>
      <OutcomeBadge outcome={participant.outcome} />
      <View style={{ width: "100%", gap: 6, marginTop: 4 }}>
        <ProgressBar value={done / required} color={done >= required ? colors.win : colors.accent} />
        <Muted style={{ fontSize: 12, textAlign: "center" }}>
          {proofs} / {required} photo{required === 1 ? "" : "s"}
        </Muted>
      </View>
    </View>
  );
}

function ProofCard({ proof, me, draft, onDraft, onComment, onReact, onReport }) {
  const mine = (kind) => (proof.reactions ?? []).some((r) => r.kind === kind && r.userId === me?.id);
  const count = (kind) => (proof.reactions ?? []).filter((r) => r.kind === kind).length;
  return (
    <Card padded={false} style={{ overflow: "hidden", gap: 0 }}>
      <Row gap={10} style={{ padding: space.md }}>
        <Avatar name={proof.user.displayName} seed={proof.user.walletPubkey} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={styles.proofName}>{proof.user.displayName}</Text>
          <Muted style={{ fontSize: 12 }}>{timeAgo(proof.capturedAt)}</Muted>
        </View>
        {proof.reported ? <Badge label="Reported" tone="warn" icon="flag" /> : null}
        <IconButton icon="flag-outline" color={colors.faint} size={16} label="Report this proof" onPress={onReport} />
      </Row>

      <Image source={{ uri: photoUrl(proof.photoPath) }} style={styles.photo} resizeMode="cover" />

      <View style={{ padding: space.md, gap: space.md }}>
        {proof.flagged ? (
          <Row gap={8} style={styles.flag}>
            <Ionicons name="warning" size={16} color={colors.warn} />
            <Text style={{ color: colors.warn, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 }}>
              {proof.flagReason || "This photo looks reused. It won't count."}
            </Text>
          </Row>
        ) : null}
        {proof.caption ? <Text style={styles.caption}>{proof.caption}</Text> : null}

        <Row gap={8}>
          <ReactionChip
            icon="flame"
            label="Respect"
            count={count("respect")}
            active={mine("respect")}
            onPress={() => onReact("respect")}
          />
          <ReactionChip
            icon="eye"
            label="Doubt"
            tone="loss"
            count={count("doubt")}
            active={mine("doubt")}
            onPress={() => onReact("doubt")}
          />
        </Row>

        {proof.comments.length > 0 ? (
          <View style={{ gap: 10 }}>
            {proof.comments.map((entry) => (
              <Row key={entry.id} gap={8} align="flex-start">
                <Avatar name={entry.user.displayName} seed={entry.user.walletPubkey} size={22} />
                <Text style={styles.comment}>
                  <Text style={{ fontFamily: fonts.bodySemi }}>{entry.user.displayName} </Text>
                  {entry.body}
                </Text>
              </Row>
            ))}
          </View>
        ) : null}

        <View style={styles.commentBox}>
          <TextInput
            value={draft}
            onChangeText={onDraft}
            placeholder="Add a comment…"
            placeholderTextColor={colors.faint}
            style={styles.commentInput}
            onSubmitEditing={() => draft.trim() && onComment()}
            returnKeyType="send"
          />
          <IconButton
            icon="arrow-up"
            size={16}
            color={draft.trim() ? colors.accentInk : colors.faint}
            style={{ backgroundColor: draft.trim() ? colors.accent : colors.raised, width: 30, height: 30 }}
            onPress={() => draft.trim() && onComment()}
            label="Send comment"
          />
        </View>

        <Text style={styles.hash}>sha256 {proof.photoHash.slice(0, 16)}…</Text>
      </View>
    </Card>
  );
}

export default function BetScreen() {
  const { id } = useLocalSearchParams();
  const [bet, setBet] = useState(null);
  const [me, setMe] = useState(null);
  const [caption, setCaption] = useState("");
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(() => {
    api(`/v1/bets/${id}`)
      .then((data) => setBet(data.bet))
      .catch((err) => setError(err.message));
    api("/v1/me")
      .then((data) => setMe(data.user))
      .catch(() => {});
  }, [id]);
  useFocusEffect(load);

  async function addProof() {
    setError("");
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    const form = new FormData();
    if (Platform.OS === "web") {
      const blob = await (await fetch(asset.uri)).blob();
      form.append("photo", blob, "proof.jpg");
    } else {
      form.append("photo", { uri: asset.uri, name: "proof.jpg", type: asset.mimeType || "image/jpeg" });
    }
    form.append("caption", caption);
    setUploading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v1/bets/${id}/proofs`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      setCaption("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function sendComment(proofId) {
    setError("");
    try {
      await api(`/v1/proofs/${proofId}/comments`, { method: "POST", json: { body: drafts[proofId] ?? "" } });
      setDrafts((d) => ({ ...d, [proofId]: "" }));
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function react(proofId, kind) {
    try {
      await api(`/v1/proofs/${proofId}/reactions`, { method: "POST", json: { kind } });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function report(proofId) {
    try {
      await api(`/v1/proofs/${proofId}/report`, { method: "POST" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function resolveEarly() {
    setError("");
    setClosing(true);
    try {
      const response = await fetch(`${API_URL}/v1/bets/${id}/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-reporter-key": "dev-reporter" },
        body: JSON.stringify({ early: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Resolve failed");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setClosing(false);
    }
  }

  if (!bet) return <LoadingScreen error={error} />;

  const active = bet.status === "active";
  const pot = bet.stakeAmount * bet.participants.length;
  const proofCount = (userId) => bet.proofs.filter((p) => p.user.id === userId && !p.flagged).length;
  const amIn = me && bet.participants.some((p) => p.user.id === me.id);
  const winners = bet.participants.filter((p) => p.outcome === "success");
  const headToHead = bet.betType === "head_to_head" && bet.participants.length === 2;

  return (
    <Screen>
      <Stack.Screen options={{ title: "" }} />

      <View style={{ gap: space.md }}>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          <StatusBadge status={bet.status} />
          <Badge label={headToHead ? "Head to head" : "Pool"} />
          {active ? <Badge label={timeLeft(bet.periodEnd)} tone="info" icon="time-outline" /> : null}
        </Row>
        <Display size={34}>{bet.title}</Display>
      </View>

      <Card tone="accent" style={{ gap: space.lg }}>
        <Row justify="space-between" align="flex-end">
          <View style={{ gap: 2 }}>
            <Text style={styles.potLabel}>{active ? "ON THE LINE" : "POT"}</Text>
            <Money value={amount(pot)} size={48} color={colors.accent} />
          </View>
          <View style={{ alignItems: "flex-end", gap: 2 }}>
            <Muted style={{ fontSize: 13 }}>{amount(bet.stakeAmount)} USDC each</Muted>
            <Muted style={{ fontSize: 13 }}>
              {bet.proofsRequired} photo{bet.proofsRequired === 1 ? "" : "s"} to make it
            </Muted>
          </View>
        </Row>
        <View style={{ gap: 6 }}>
          <ProgressBar value={periodProgress(bet.periodStart, bet.periodEnd)} />
          <Row justify="space-between">
            <Muted style={{ fontSize: 12 }}>{new Date(bet.periodStart).toLocaleDateString()}</Muted>
            <Muted style={{ fontSize: 12 }}>{new Date(bet.periodEnd).toLocaleDateString()}</Muted>
          </Row>
        </View>
      </Card>

      {!active && winners.length > 0 ? (
        <Card style={{ borderColor: "rgba(74,222,128,0.35)", backgroundColor: colors.winSoft }}>
          <Row gap={12}>
            <Ionicons name="trophy" size={22} color={colors.win} />
            <Text style={{ color: colors.text, fontFamily: fonts.bodySemi, fontSize: 15, flex: 1 }}>
              {winners.length === bet.participants.length
                ? "Everyone made it. Stakes go back to each person."
                : `${winners.map((w) => w.user.displayName).join(" & ")} took the pot.`}
            </Text>
          </Row>
        </Card>
      ) : null}

      <Card>
        <Row align="flex-start" gap={4}>
          {bet.participants.map((participant, index) => (
            <View key={participant.user.id} style={{ flex: 1, flexDirection: "row", alignItems: "flex-start" }}>
              {index > 0 && headToHead ? (
                <View style={styles.vs}>
                  <Text style={styles.vsText}>VS</Text>
                </View>
              ) : null}
              <Contender
                participant={participant}
                proofs={proofCount(participant.user.id)}
                required={bet.proofsRequired}
                isMe={me?.id === participant.user.id}
              />
            </View>
          ))}
        </Row>
      </Card>

      {active && amIn ? (
        <Card tone="raised">
          <Row gap={10}>
            <View style={styles.camIcon}>
              <Ionicons name="camera" size={18} color={colors.accentInk} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontFamily: fonts.displayMedium, fontSize: 17 }}>Post your proof</Text>
              <Muted style={{ fontSize: 13 }}>Your circle sees it and can call it out.</Muted>
            </View>
          </Row>
          <Field value={caption} onChangeText={setCaption} placeholder="Say something (optional)" />
          <Button
            label={uploading ? "Uploading…" : "Choose a photo"}
            icon="image"
            onPress={addProof}
            loading={uploading}
          />
        </Card>
      ) : null}

      <ErrorText onDismiss={() => setError("")}>{error}</ErrorText>

      <SectionHeader title="Proof" count={bet.proofs.length} />
      {bet.proofs.length === 0 ? (
        <EmptyState icon="camera-outline" title="No proof yet" body="The first photo posted shows up here for the circle to react to." />
      ) : (
        bet.proofs.map((proof) => (
          <ProofCard
            key={proof.id}
            proof={proof}
            me={me}
            draft={drafts[proof.id] ?? ""}
            onDraft={(text) => setDrafts((d) => ({ ...d, [proof.id]: text }))}
            onComment={() => sendComment(proof.id)}
            onReact={(kind) => react(proof.id, kind)}
            onReport={() => report(proof.id)}
          />
        ))
      )}

      <View style={styles.fine}>
        <Row gap={6}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.faint} />
          <Text style={styles.fineTitle}>Fine print</Text>
        </Row>
        <Text style={styles.fineText}>{bet.feePayer}</Text>
        <Text style={styles.fineText}>Goal hash {bet.goalHash?.slice(0, 20)}…</Text>
        {bet.evidenceHash ? <Text style={styles.fineText}>Evidence {bet.evidenceHash.slice(0, 20)}…</Text> : null}
        {active ? (
          <Button
            label="Close the period now (devnet demo)"
            icon="flash-outline"
            tone="secondary"
            size="sm"
            fill={false}
            loading={closing}
            onPress={resolveEarly}
            style={{ marginTop: 6 }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  potLabel: { color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1.4, opacity: 0.8 },
  contender: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 4 },
  contenderName: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 15, maxWidth: "100%" },
  vs: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.raised,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 11,
    marginHorizontal: -10,
    zIndex: 1,
  },
  vsText: { color: colors.muted, fontFamily: fonts.display, fontSize: 12 },
  camIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  proofName: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 },
  photo: { width: "100%", aspectRatio: 4 / 3, backgroundColor: colors.raised },
  flag: {
    backgroundColor: colors.warnSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  caption: { color: colors.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  reaction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  reactionText: { color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 13 },
  reactionCount: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  comment: { color: colors.text, fontFamily: fonts.body, fontSize: 14, lineHeight: 20, flex: 1 },
  commentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },
  commentInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    paddingVertical: 6,
    outlineStyle: "none",
  },
  hash: { color: colors.faint, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), fontSize: 11 },
  fine: {
    gap: 6,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: space.md,
  },
  fineTitle: { color: colors.faint, fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  fineText: { color: colors.faint, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
});
