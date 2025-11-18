
import { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import axios from "axios";
import Toast from "react-native-toast-message";
import { BASE_URL } from "../constant";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function Profile({ navigation }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);

    const loadUserData = async () => {
        try {
            const token = await AsyncStorage.getItem("access_token");
            if (token) {
                try {
                    const { data } = await axios.get(`${BASE_URL}/api/users/profile`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    const user = data.user || data.data || data;
                    setUsername(user.name || user.username || (await AsyncStorage.getItem("username")) || "User");
                    setEmail(user.email || (await AsyncStorage.getItem("email")) || "user@example.com");
                } catch (err) {
                    const storedUsername = await AsyncStorage.getItem("username");
                    const storedEmail = await AsyncStorage.getItem("email");
                    setUsername(storedUsername || "User");
                    setEmail(storedEmail || "user@example.com");
                }
            } else {
                const storedUsername = await AsyncStorage.getItem("username");
                const storedEmail = await AsyncStorage.getItem("email");
                setUsername(storedUsername || "User");
                setEmail(storedEmail || "user@example.com");
            }
        } catch (error) {
            console.error("Load user data error:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadUserData();
        }, [])
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#047857" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarCircle}>
                    <MaterialIcons name="person" size={60} color="#047857" />
                </View>
                <Text style={styles.username}>{username}</Text>
                <Text style={styles.email}>{email}</Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate("EditProfile", { username, email })}
                >
                    <MaterialIcons name="edit" size={18} color="#047857" />
                    <Text style={styles.actionText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.logoutBtn]}
                    onPress={async () => {
                        try {
                            await AsyncStorage.removeItem("access_token");
                            await AsyncStorage.removeItem("user_id");
                            await AsyncStorage.removeItem("username");
                            await AsyncStorage.removeItem("email");
                            Toast.show({ type: "success", text1: "Success", text2: "Logged out successfully" });
                            navigation.replace("MyTabs");
                        } catch (err) {
                            console.error("Logout error:", err);
                            Toast.show({ type: "error", text1: "Error", text2: "Failed to logout" });
                        }
                    }}
                >
                    <MaterialIcons name="logout" size={18} color="#FFFFFF" />
                    <Text style={[styles.actionText, { color: "#FFFFFF" }]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
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
    actions: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    actionText: {
        marginLeft: 12,
        fontSize: 16,
        color: "#047857",
        fontWeight: "600",
    },
    logoutBtn: {
        backgroundColor: "#EF4444",
        justifyContent: "center",
    },
});
