import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "./theme";

export function Wordmark({ size = 22 }) {
  const outer = size + 6;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={[styles.chip, { width: outer, height: outer, borderRadius: outer / 2 }]}>
        <View
          style={{
            width: size * 0.62,
            height: size * 0.62,
            borderRadius: size,
            borderWidth: 2,
            borderColor: colors.accentInk,
          }}
        />
      </View>
      <Text style={[styles.wordmark, { fontSize: size }]}>ante</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: { color: colors.text, fontFamily: fonts.display, letterSpacing: -0.8 },
});
