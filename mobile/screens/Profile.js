
import { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
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
    const [point, setPoint] = useState(0);
    const [totalDonations, setTotalDonations] = useState(0);
    const [totalVolunteerActivities, setTotalVolunteerActivities] = useState(0);
    const [role, setRole] = useState("");
    const [achievements, setAchievements] = useState([]);
    const [activityLog, setActivityLog] = useState([]);
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
                    setPoint(user.point || 0);
                    setTotalDonations(user.totalDonations || 0);
                    setTotalVolunteerActivities(user.totalVolunteerActivities || 0);
                    setRole(user.role || "user");
                    setAchievements(user.achievements || []);
                    setActivityLog(user.activityLog || []);
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
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.logoutButton}
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
                        <MaterialIcons name="logout" size={20} color="#EF4444" />
                    </TouchableOpacity>
                    <View style={styles.avatarCircle}>
                        <MaterialIcons name="person" size={60} color="#047857" />
                    </View>
                    <View style={styles.usernameRow}>
                        <Text style={styles.username}>{username}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("EditProfile", { username, email })}>
                            <MaterialIcons name="edit" size={20} color="#047857" />
                        </TouchableOpacity>
                    </View>
                    {role && role === "admin" && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Admin</Text>
                        </View>
                    )}
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <MaterialIcons name="stars" size={32} color="#047857" />
                        <Text style={styles.statNumber}>{point}</Text>
                        <Text style={styles.statLabel}>Points</Text>
                    </View>
                    <View style={styles.statBox}>
                        <MaterialIcons name="favorite" size={32} color="#EF4444" />
                        <Text style={styles.statNumber}>{totalDonations}</Text>
                        <Text style={styles.statLabel}>Donations</Text>
                    </View>
                    <View style={styles.statBox}>
                        <MaterialIcons name="volunteer-activism" size={32} color="#3B82F6" />
                        <Text style={styles.statNumber}>{totalVolunteerActivities}</Text>
                        <Text style={styles.statLabel}>Activities</Text>
                    </View>
                </View>

                {/* Achievements Section */}
                {achievements.length > 0 && (
                    <View style={styles.achievementsContainer}>
                        <Text style={styles.sectionTitle}>🏆 Achievements</Text>
                        {achievements.map((achievement, index) => (
                            <View key={achievement.id || index} style={styles.achievementCard}>
                                <Text style={styles.achievementBadge}>{achievement.badge}</Text>
                                <View style={styles.achievementInfo}>
                                    <Text style={styles.achievementName}>{achievement.name}</Text>
                                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                                </View>
                                <View style={styles.achievementPoints}>
                                    <MaterialIcons name="stars" size={16} color="#F59E0B" />
                                    <Text style={styles.achievementPointsText}>+{achievement.points}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Activity Log Section */}
                {activityLog.length > 0 && (
                    <View style={styles.activityLogContainer}>
                        <Text style={styles.sectionTitle}>📜 Activity Log</Text>
                        {activityLog.slice(0, 5).map((activity, index) => (
                            <View key={index} style={styles.activityCard}>
                                <View style={styles.activityIcon}>
                                    <MaterialIcons name="history" size={20} color="#047857" />
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityReason}>
                                        {activity.reason === 'volunteer_register' ? 'Volunteer Registered' : activity.reason}
                                    </Text>
                                    <Text style={styles.activityTime}>
                                        {new Date(activity.timestamp).toLocaleDateString('id-ID', { 
                                            day: 'numeric', 
                                            month: 'short', 
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                                <Text style={styles.activityPoints}>+{activity.points}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        paddingBottom: 20,
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
        position: "relative",
    },
    logoutButton: {
        position: "absolute",
        top: 20,
        right: 20,
        backgroundColor: "transparent",
        borderWidth: 2,
        borderColor: "#EF4444",
        borderRadius: 8,
        padding: 8,
        zIndex: 10,
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
    usernameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    username: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
    },
    email: {
        fontSize: 14,
        color: "#6B7280",
    },
    badge: {
        marginTop: 8,
        backgroundColor: "#047857",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "600",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statBox: {
        alignItems: "center",
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 4,
    },
    achievementsContainer: {
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 12,
    },
    achievementCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: "#F59E0B",
    },
    achievementBadge: {
        fontSize: 32,
        marginRight: 12,
    },
    achievementInfo: {
        flex: 1,
    },
    achievementName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 2,
    },
    achievementDesc: {
        fontSize: 12,
        color: "#6B7280",
    },
    achievementPoints: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    achievementPointsText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#F59E0B",
        marginLeft: 4,
    },
    activityLogContainer: {
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    activityCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#ECFDF5",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityReason: {
        fontSize: 14,
        fontWeight: "500",
        color: "#111827",
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: "#6B7280",
    },
    activityPoints: {
        fontSize: 14,
        fontWeight: "600",
        color: "#047857",
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
