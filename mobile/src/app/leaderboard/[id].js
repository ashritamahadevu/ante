import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { api } from "../../api";
import { colors, fonts, radius, space } from "../../theme";
import {
  Avatar,
  Card,
  Display,
  EmptyState,
  ErrorText,
  Ionicons,
  Muted,
  ProgressBar,
  Row,
  Screen,
  Skeleton,
} from "../../ui";

const medal = ["#FBBF24", "#CBD5E1", "#F59E0B"];
const podiumHeight = [96, 72, 56];

function PodiumSpot({ row, place }) {
  if (!row) return <View style={{ flex: 1 }} />;
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 8 }}>
      {place === 0 ? <Ionicons name="trophy" size={20} color={medal[0]} /> : null}
      <Avatar name={row.user.displayName} seed={row.user.walletPubkey} size={place === 0 ? 60 : 48} ring={medal[place]} />
      <Text style={styles.podiumName} numberOfLines={1}>
        {row.user.displayName}
      </Text>
      <View style={[styles.podium, { height: podiumHeight[place], borderColor: medal[place] }]}>
        <Text style={[styles.podiumPlace, { color: medal[place] }]}>{place + 1}</Text>
        <Text style={styles.podiumRate}>{Math.round(row.successRate * 100)}%</Text>
      </View>
    </View>
  );
}

export default function Leaderboard() {
  const { id } = useLocalSearchParams();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api(`/v1/circles/${id}/leaderboard`)
      .then((data) => setRows(data.leaderboard))
      .catch((err) => setError(err.message));
  }, [id]);
  useFocusEffect(load);

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Display size={34}>Who follows through</Display>
        <Muted>Ranked by success rate, then streak, across settled bets in this circle.</Muted>
      </View>

      <ErrorText>{error}</ErrorText>

      {rows === null ? (
        <>
          <Skeleton height={180} />
          <Skeleton height={70} />
        </>
      ) : rows.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="No settled bets yet"
          body="Once a bet closes, everyone who was in it shows up here."
        />
      ) : (
        <>
          <Card style={{ paddingTop: space.xl, paddingBottom: 0, overflow: "hidden" }}>
            <Row align="flex-end" gap={10}>
              <PodiumSpot row={rows[1]} place={1} />
              <PodiumSpot row={rows[0]} place={0} />
              <PodiumSpot row={rows[2]} place={2} />
            </Row>
          </Card>

          <Card padded={false}>
            {rows.map((row, index) => (
              <View key={row.user.id} style={[styles.row, index > 0 && styles.rowBorder]}>
                <Text style={[styles.rank, index < 3 && { color: medal[index] }]}>{index + 1}</Text>
                <Avatar name={row.user.displayName} seed={row.user.walletPubkey} size={36} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Row justify="space-between">
                    <Text style={styles.name} numberOfLines={1}>
                      {row.user.displayName}
                    </Text>
                    <Text style={styles.rate}>{Math.round(row.successRate * 100)}%</Text>
                  </Row>
                  <ProgressBar value={row.successRate} color={row.successRate >= 0.5 ? colors.win : colors.loss} height={5} />
                  <Row gap={12}>
                    <Row gap={4}>
                      <Ionicons name="flame" size={13} color={row.streak > 0 ? colors.warn : colors.faint} />
                      <Muted style={{ fontSize: 12 }}>{row.streak} streak</Muted>
                    </Row>
                    <Muted style={{ fontSize: 12 }}>
                      {row.successes} of {row.resolved} made
                    </Muted>
                  </Row>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  podiumName: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14, maxWidth: "100%" },
  podium: {
    width: "100%",
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    borderWidth: 1,
    borderBottomWidth: 0,
    backgroundColor: colors.raised,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  podiumPlace: { fontFamily: fonts.display, fontSize: 22 },
  podiumRate: { color: colors.muted, fontFamily: fonts.bodySemi, fontSize: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: space.lg, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  rank: { color: colors.faint, fontFamily: fonts.display, fontSize: 16, width: 18, textAlign: "center" },
  name: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 15, flex: 1 },
  rate: { color: colors.text, fontFamily: fonts.display, fontSize: 16 },
});
