import { Pressable, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { colors, fonts } from "../theme";

function WalletLink() {
  return (
    <Pressable
      onPress={() => router.push("/wallet")}
      accessibilityRole="button"
      accessibilityLabel="Wallet"
      style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingRight: 8, paddingVertical: 6 }}
    >
      <Ionicons name="wallet-outline" size={16} color={colors.text} />
      <Text style={{ color: colors.text, fontFamily: fonts.bodySemi, fontSize: 14 }}>Wallet</Text>
    </Pressable>
  );
}

export default function Layout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: "Back",
          contentStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontFamily: fonts.bodySemi, fontSize: 16 },
          title: "Ante",
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: "Ante" }} />
        <Stack.Screen name="circles" options={{ title: "Ante", headerBackVisible: false }} />
        <Stack.Screen name="circle/[id]" options={{ title: "", headerRight: () => <WalletLink /> }} />
        <Stack.Screen name="bet/[id]" options={{ title: "", headerRight: () => <WalletLink /> }} />
        <Stack.Screen name="leaderboard/[id]" options={{ title: "Leaderboard", headerRight: () => <WalletLink /> }} />
        <Stack.Screen name="wallet" options={{ title: "Wallet" }} />
      </Stack>
    </>
  );
}
