import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { avatarColor, colors, fonts, radius, space } from "./theme";

export { Ionicons };

export function Screen({ children, refreshing = false, onRefresh, contentStyle }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function Eyebrow({ children, color = colors.accent, style }) {
  return <Text style={[styles.eyebrow, { color }, style]}>{children}</Text>;
}

export function Display({ children, style, size = 40 }) {
  return (
    <Text style={[styles.display, { fontSize: size, lineHeight: Math.round(size * 1.05) }, style]}>{children}</Text>
  );
}

export function Title({ children, style }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function H2({ children, style }) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

export function Body({ children, style, numberOfLines }) {
  return (
    <Text style={[styles.body, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }) {
  return (
    <Text style={[styles.muted, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Row({ children, gap = space.sm, style, align = "center", justify }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: align, gap, justifyContent: justify }, style]}>{children}</View>
  );
}

export function Spacer({ size = space.md }) {
  return <View style={{ height: size }} />;
}

export function Tap({ children, onPress, style, disabled, scale = 0.98, ...rest }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        typeof style === "function" ? style({ pressed }) : style,
        pressed && !disabled && { opacity: 0.85, transform: [{ scale }] },
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

export function Card({ children, onPress, style, tone = "surface", padded = true }) {
  const body = (
    <View
      style={[
        styles.card,
        tone === "raised" && { backgroundColor: colors.raised },
        tone === "accent" && { backgroundColor: colors.accentSoft, borderColor: "rgba(198,255,61,0.28)" },
        !padded && { padding: 0 },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return body;
  return <Tap onPress={onPress}>{body}</Tap>;
}

export function Field({ label, hint, value, onChangeText, placeholder, prefix, suffix, style, ...rest }) {
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, style]}>
        {prefix ? <Text style={styles.affix}>{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          style={styles.input}
          {...rest}
        />
        {suffix ? <Text style={styles.affix}>{suffix}</Text> : null}
      </View>
      {hint ? <Muted style={{ fontSize: 13 }}>{hint}</Muted> : null}
    </View>
  );
}

const buttonTones = {
  primary: { bg: colors.accent, fg: colors.accentInk, border: colors.accent },
  secondary: { bg: colors.raised, fg: colors.text, border: colors.lineStrong },
  ghost: { bg: "transparent", fg: colors.text, border: "transparent" },
  danger: { bg: colors.lossSoft, fg: colors.loss, border: "rgba(255,107,87,0.3)" },
};

export function Button({ label, onPress, tone = "primary", icon, loading, disabled, size = "lg", style, fill = true }) {
  const t = buttonTones[tone] ?? buttonTones.primary;
  const small = size === "sm";
  return (
    <Tap
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: t.bg, borderColor: t.border },
        small && styles.buttonSm,
        !fill && { alignSelf: "flex-start" },
        (disabled || loading) && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.fg} size="small" />
      ) : icon ? (
        <Ionicons name={icon} size={small ? 15 : 18} color={t.fg} />
      ) : null}
      <Text style={[styles.buttonText, { color: t.fg }, small && { fontSize: 13 }]}>{label}</Text>
    </Tap>
  );
}

export function IconButton({ icon, onPress, color = colors.text, size = 18, label, style }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label} style={[styles.iconButton, style]} scale={0.92}>
      <Ionicons name={icon} size={size} color={color} />
    </Tap>
  );
}

const badgeTones = {
  neutral: { bg: colors.raised, fg: colors.muted },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  win: { bg: colors.winSoft, fg: colors.win },
  loss: { bg: colors.lossSoft, fg: colors.loss },
  warn: { bg: colors.warnSoft, fg: colors.warn },
  info: { bg: colors.infoSoft, fg: colors.info },
};

export function Badge({ label, tone = "neutral", icon, dot }) {
  const t = badgeTones[tone] ?? badgeTones.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.fg }]} /> : null}
      {icon ? <Ionicons name={icon} size={12} color={t.fg} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const betStatus = {
  active: { label: "Live", tone: "accent" },
  funding: { label: "Funding", tone: "warn" },
  resolved: { label: "Dispute window", tone: "warn" },
  disputed: { label: "Disputed", tone: "loss" },
  final: { label: "Final", tone: "neutral" },
  claimable: { label: "Claimable", tone: "win" },
};

export function StatusBadge({ status }) {
  const s = betStatus[status] ?? { label: status, tone: "neutral" };
  return <Badge label={s.label} tone={s.tone} dot />;
}

const outcomeMap = {
  success: { label: "Made it", tone: "win", icon: "checkmark" },
  fail: { label: "Missed", tone: "loss", icon: "close" },
  refunded: { label: "Refunded", tone: "info", icon: "refresh" },
  pending: { label: "In play", tone: "neutral", icon: "time-outline" },
};

export function OutcomeBadge({ outcome }) {
  const o = outcomeMap[outcome] ?? outcomeMap.pending;
  return <Badge label={o.label} tone={o.tone} icon={o.icon} />;
}

export function initials(name = "") {
  const clean = name.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ name, seed, size = 36, ring }) {
  const bg = avatarColor(seed || name);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: ring ? 2 : 0,
        borderColor: ring || "transparent",
      }}
    >
      <Text style={{ color: "#0B0B0D", fontFamily: fonts.display, fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}

export function AvatarStack({ users = [], size = 28, max = 4 }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <View style={{ flexDirection: "row" }}>
      {shown.map((user, index) => (
        <View key={user.id} style={{ marginLeft: index === 0 ? 0 : -size * 0.3 }}>
          <Avatar name={user.displayName} seed={user.walletPubkey || user.id} size={size} ring={colors.surface} />
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={{
            marginLeft: -size * 0.3,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.raised,
            borderWidth: 2,
            borderColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.muted, fontFamily: fonts.bodySemi, fontSize: size * 0.36 }}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function Money({ value, size = 32, unit = "USDC", color = colors.text }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
      <Text style={[styles.money, { fontSize: size, color }]}>{value}</Text>
      {unit ? <Text style={[styles.moneyUnit, { fontSize: Math.max(11, size * 0.36) }]}>{unit}</Text> : null}
    </View>
  );
}

export function Stat({ label, value, sub, style }) {
  return (
    <View style={[styles.stat, style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Muted style={{ fontSize: 12 }}>{sub}</Muted> : null}
    </View>
  );
}

export function Chip({ label, selected, onPress, icon }) {
  return (
    <Tap
      onPress={onPress}
      scale={0.95}
      style={[styles.chip, selected && { backgroundColor: colors.accent, borderColor: colors.accent }]}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.accentInk : colors.muted} /> : null}
      <Text style={[styles.chipText, selected && { color: colors.accentInk }]}>{label}</Text>
    </Tap>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            {option.icon ? (
              <Ionicons name={option.icon} size={15} color={active ? colors.text : colors.faint} />
            ) : null}
            <Text style={[styles.segmentText, active && { color: colors.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SectionHeader({ title, count, action, onAction }) {
  return (
    <Row justify="space-between" style={{ marginTop: space.sm }}>
      <Row gap={8}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count != null ? <Text style={styles.sectionCount}>{count}</Text> : null}
      </Row>
      {action ? (
        <Tap onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Tap>
      ) : null}
    </Row>
  );
}

export function EmptyState({ icon = "sparkles-outline", title, body, children }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {body ? <Muted style={{ textAlign: "center", maxWidth: 300 }}>{body}</Muted> : null}
      {children}
    </View>
  );
}

export function ErrorText({ children, onDismiss }) {
  if (!children) return null;
  return (
    <View style={styles.banner}>
      <Ionicons name="alert-circle" size={18} color={colors.loss} />
      <Text style={styles.bannerText}>{children}</Text>
      {onDismiss ? <IconButton icon="close" size={16} color={colors.loss} onPress={onDismiss} label="Dismiss" /> : null}
    </View>
  );
}

export function Skeleton({ height = 80, style }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[{ height, borderRadius: radius.lg, backgroundColor: colors.surface, opacity: pulse }, style]}
    />
  );
}

export function LoadingScreen({ error }) {
  return (
    <Screen>
      <Skeleton height={28} style={{ width: "40%" }} />
      <Skeleton height={48} style={{ width: "80%" }} />
      <Skeleton height={140} />
      <Skeleton height={90} />
      <Skeleton height={90} />
      <ErrorText>{error}</ErrorText>
    </Screen>
  );
}

export function ProgressBar({ value = 0, color = colors.accent, height = 6 }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: colors.raised, overflow: "hidden" }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: colors.line }, style]} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: space.xl - 4,
    paddingBottom: 72,
    gap: space.md + 2,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  eyebrow: { fontFamily: fonts.bodySemi, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase" },
  display: { color: colors.text, fontFamily: fonts.display, letterSpacing: -1 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
  h2: { color: colors.text, fontFamily: fonts.displayMedium, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { color: colors.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  muted: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  label: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 13 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    gap: 8,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    paddingVertical: 13,
    fontSize: 16,
    outlineStyle: "none",
  },
  affix: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 15 },
  button: {
    flexDirection: "row",
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSm: { paddingVertical: 8, paddingHorizontal: 14 },
  buttonText: { fontFamily: fonts.bodyBold, fontSize: 15, letterSpacing: 0.1 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  money: { fontFamily: fonts.display, letterSpacing: -1, fontVariant: ["tabular-nums"] },
  moneyUnit: { color: colors.muted, fontFamily: fonts.bodySemi, letterSpacing: 0.5 },
  stat: {
    flex: 1,
    backgroundColor: colors.raised,
    borderRadius: radius.md,
    padding: space.md,
    gap: 2,
  },
  statLabel: { color: colors.faint, fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  statValue: { color: colors.text, fontFamily: fonts.display, fontSize: 20, letterSpacing: -0.4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
  },
  chipText: { color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  segmentActive: { backgroundColor: colors.raised },
  segmentText: { color: colors.faint, fontFamily: fonts.bodySemi, fontSize: 14 },
  sectionTitle: { color: colors.text, fontFamily: fonts.displayMedium, fontSize: 17 },
  sectionCount: {
    color: colors.muted,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    backgroundColor: colors.raised,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  sectionAction: { color: colors.accent, fontFamily: fonts.bodySemi, fontSize: 14 },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: space.xxl,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.lineStrong,
    borderRadius: radius.lg,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { color: colors.text, fontFamily: fonts.displayMedium, fontSize: 17 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.lossSoft,
    borderColor: "rgba(255,107,87,0.3)",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bannerText: { flex: 1, color: colors.loss, fontFamily: fonts.bodyMedium, fontSize: 14 },
});
