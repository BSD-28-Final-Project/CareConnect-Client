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

  async function handleLogout() {
    try {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("user_id");
      await AsyncStorage.removeItem("username");
      await AsyncStorage.removeItem("email");
      setIsLoggedIn(false);
      Toast.show({ type: "success", text1: "Success", text2: "Logged out" });
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

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
        name={isLoggedIn ? "Logout" : "Login"}
        component={() => null} // dummy component
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons
              name={isLoggedIn ? "logout" : "login"}
              size={size}
              color={isLoggedIn ? "red" : color}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // prevent default tab navigation
            AsyncStorage.getItem("access_token").then((token) => {
              if (token) {
                handleLogout();
              } else {
                navigation.navigate("Login");
              }
            });
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
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <MyStack />
      <Toast />
    </NavigationContainer>
  );
}
