import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Home from "./screens/Home";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Donation from "./screens/Donation";
import Point from "./screens/Point";
import PostDetail from "./screens/PostDetail";
import Profile from "./screens/Profile";
import EditProfile from "./screens/EditProfile";
import Subscription from "./screens/Subscription";
import AddPaymentMethod from "./screens/AddPaymentMethod";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MyTabs({ navigation }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
    const unsub = navigation.addListener("focus", checkLoginStatus); // update saat fokus
    return unsub;
  }, [navigation]);

  const checkLoginStatus = async () => {
    const token = await AsyncStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#047857",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Donation"
        component={Donation}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="favorite" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Poin"
        component={Point}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="star" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Subscription"
        component={Subscription}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="card-membership" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={isLoggedIn ? "Profile" : "Login"}
        component={isLoggedIn ? Profile : Login}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name={isLoggedIn ? "person" : "login"}
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: async (e) => {
            const token = await AsyncStorage.getItem("access_token");
            setIsLoggedIn(!!token);
          },
        }}
      />
    </Tab.Navigator>
  );
}

function MyStack() {
  return (
    <Stack.Navigator initialRouteName="MyTabs">
      <Stack.Screen
        name="MyTabs"
        component={MyTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={Profile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetail}
        options={{ headerBackTitle: "Back" }}
      />
      <Stack.Screen
        name="Subscription"
        component={Subscription}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddPaymentMethod"
        component={AddPaymentMethod}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    // DEVELOPMENT ONLY: Clear storage on fresh start
    // Comment this out in production!
    const clearStorageOnStart = async () => {
      try {
        // Uncomment the line below to clear storage on every app start (for testing)
        await AsyncStorage.clear();
        console.log("AsyncStorage cleared on app start");
      } catch (error) {
        console.error("Error clearing storage:", error);
      }
    };

    clearStorageOnStart();
  }, []);

  return (
    <NavigationContainer>
      <MyStack />
      <Toast />
    </NavigationContainer>
  );
}
