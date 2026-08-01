import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const COLORS = {
  surface: "#201F1F",
  border: "#4D4632",
  muted: "#817C6E",
  yellow: "#FFD600",
  yellowInk: "#221B00",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#131313" },
        tabBarActiveTintColor: COLORS.yellowInk,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          lineHeight: 14,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          marginHorizontal: 28,
          marginVertical: 7,
          borderRadius: 18,
        },
        tabBarActiveBackgroundColor: COLORS.yellow,
        tabBarStyle: {
          height: 70,
          paddingHorizontal: 20,
          paddingTop: 2,
          paddingBottom: 4,
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="groups"
        options={{
          title: "Groups",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="groups" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
