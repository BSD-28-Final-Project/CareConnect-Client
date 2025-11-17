import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function Logout({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // You can fetch user data from API here
      const storedUsername = await AsyncStorage.getItem("username");
      const storedEmail = await AsyncStorage.getItem("email");
      setUsername(storedUsername || "User");
      setEmail(storedEmail || "user@example.com");
    } catch (error) {
      console.error("Load user data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("user_id");
    await AsyncStorage.removeItem("username");
    await AsyncStorage.removeItem("email");

    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Logged out successfully",
    });

    navigation.replace("MyTabs");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={60} color="#047857" />
        </View>
        <Text style={styles.username}>{username}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="edit" size={24} color="#6B7280" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="history" size={24} color="#6B7280" />
          <Text style={styles.menuText}>Activity History</Text>
          <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <MaterialIcons name="settings" size={24} color="#6B7280" />
          <Text style={styles.menuText}>Settings</Text>
          <MaterialIcons name="chevron-right" size={24} color="#D1D5DB" />
        </TouchableOpacity>
      </View> */}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <MaterialIcons name="logout" size={20} color="#FFFFFF" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
  },
  menuContainer: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#EF4444",
    marginHorizontal: 16,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});