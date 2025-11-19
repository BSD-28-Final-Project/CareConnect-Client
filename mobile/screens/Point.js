import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../constant";

export default function Point({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const id = await AsyncStorage.getItem("user_id");

      if (!token || !id) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);
      setUserId(id);
      loadAchievements(id);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsLoggedIn(false);
      setLoading(false);
    }
  };

  const loadAchievements = async (id) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      console.log("Fetching achievements for userId:", id);
      console.log(
        "API URL:",
        `${BASE_URL}/api/gamification/achievements/${id}`
      );

      const response = await axios.get(
        `${BASE_URL}/api/gamification/achievements/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Achievements response:", response.data);
      setData(response.data);
    } catch (error) {
      console.error(
        "Error loading achievements:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userId) {
      loadAchievements(userId);
    }
  }, [userId]);

  const getLevelColor = (level) => {
    switch (level) {
      case "Bronze":
        return "#CD7F32";
      case "Silver":
        return "#C0C0C0";
      case "Gold":
        return "#FFD700";
      case "Platinum":
        return "#E5E4E2";
      case "Diamond":
        return "#B9F2FF";
      default:
        return "#9CA3AF";
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case "Bronze":
        return "military-tech";
      case "Silver":
        return "military-tech";
      case "Gold":
        return "emoji-events";
      case "Platinum":
        return "emoji-events";
      case "Diamond":
        return "workspace-premium";
      default:
        return "stars";
    }
  };

  const getAchievementIcon = (type) => {
    switch (type) {
      case "First Donation":
        return "volunteer-activism";
      case "Generous Donor":
        return "favorite";
      case "Active Volunteer":
        return "people";
      case "Loyal Supporter":
        return "loyalty";
      case "Community Hero":
        return "emoji-events";
      default:
        return "star";
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Memuat pencapaian...</Text>
      </View>
    );
  }

  // Not logged in state
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialIcons name="workspace-premium" size={48} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Pencapaian Saya</Text>
        </View>

        <View style={styles.emptyStateContainer}>
          <MaterialIcons name="login" size={80} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>Login Diperlukan</Text>
          <Text style={styles.emptyStateText}>
            Silakan login untuk melihat poin dan pencapaian Anda
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <MaterialIcons name="login" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Login Sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="error-outline" size={64} color="#9CA3AF" />
        <Text style={styles.emptyText}>Gagal memuat data</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadAchievements(userId)}
        >
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#10B981"]}
        />
      }
    >
      {/* Header Stats */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <MaterialIcons name="workspace-premium" size={48} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Pencapaian Saya</Text>
        </View>
      </View>

      {/* Points Card */}
      <View style={styles.pointsCard}>
        <View style={styles.pointsRow}>
          <View style={styles.pointsItem}>
            <MaterialIcons name="stars" size={32} color="#FFD700" />
            <Text style={styles.pointsValue}>{data.totalPoints || 0}</Text>
            <Text style={styles.pointsLabel}>Total Poin</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pointsItem}>
            <MaterialIcons
              name={getLevelIcon(data.level)}
              size={32}
              color={getLevelColor(data.level)}
            />
            <Text
              style={[styles.levelValue, { color: getLevelColor(data.level) }]}
            >
              {data.level || "Bronze"}
            </Text>
            <Text style={styles.pointsLabel}>Level Saat Ini</Text>
          </View>
        </View>

        {/* Progress to Next Level */}
        {data.nextLevel && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Menuju {data.nextLevel.name}
              </Text>
              <Text style={styles.progressPoints}>
                {data.totalPoints}/{data.nextLevel.requiredPoints} poin
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (data.totalPoints / data.nextLevel.requiredPoints) * 100,
                      100
                    )}%`,
                    backgroundColor: getLevelColor(data.nextLevel.name),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressRemaining}>
              {data.nextLevel.requiredPoints - data.totalPoints} poin lagi untuk
              naik level
            </Text>
          </View>
        )}
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistik</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#DBEAFE" }]}
            >
              <MaterialIcons
                name="volunteer-activism"
                size={24}
                color="#3B82F6"
              />
            </View>
            <Text style={styles.statValue}>
              {data.statistics?.totalDonations || 0}
            </Text>
            <Text style={styles.statLabel}>Total Donasi</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#D1FAE5" }]}
            >
              <MaterialIcons name="attach-money" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>
              {data.statistics?.totalDonationAmount
                ? `Rp ${(data.statistics.totalDonationAmount / 1000).toFixed(
                    0
                  )}k`
                : "Rp 0"}
            </Text>
            <Text style={styles.statLabel}>Jumlah Donasi</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#FEE2E2" }]}
            >
              <MaterialIcons name="people" size={24} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>
              {data.statistics?.totalVolunteers || 0}
            </Text>
            <Text style={styles.statLabel}>Kegiatan Relawan</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[styles.statIconContainer, { backgroundColor: "#FEF3C7" }]}
            >
              <MaterialIcons name="emoji-events" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>
              {data.achievements?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Pencapaian</Text>
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badge Pencapaian</Text>
        {data.achievements && data.achievements.length > 0 ? (
          <View style={styles.achievementsList}>
            {data.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <View
                  style={[
                    styles.achievementIcon,
                    achievement.unlocked
                      ? { backgroundColor: "#10B981" }
                      : { backgroundColor: "#E5E7EB" },
                  ]}
                >
                  <MaterialIcons
                    name={getAchievementIcon(achievement.name)}
                    size={32}
                    color={achievement.unlocked ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
                <View style={styles.achievementContent}>
                  <Text
                    style={[
                      styles.achievementName,
                      !achievement.unlocked && styles.achievementNameLocked,
                    ]}
                  >
                    {achievement.name}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  <View style={styles.achievementFooter}>
                    <View style={styles.achievementPoints}>
                      <MaterialIcons name="stars" size={16} color="#F59E0B" />
                      <Text style={styles.achievementPointsText}>
                        +{achievement.points} poin
                      </Text>
                    </View>
                    {achievement.unlocked ? (
                      <View style={styles.unlockedBadge}>
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text style={styles.unlockedText}>Terbuka</Text>
                      </View>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <MaterialIcons name="lock" size={16} color="#9CA3AF" />
                        <Text style={styles.lockedText}>Terkunci</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyAchievements}>
            <MaterialIcons name="emoji-events" size={48} color="#D1D5DB" />
            <Text style={styles.emptyAchievementsText}>
              Belum ada pencapaian terbuka
            </Text>
            <Text style={styles.emptyAchievementsSubtext}>
              Mulai berdonasi dan menjadi relawan untuk membuka badge!
            </Text>
          </View>
        )}
      </View>

      {/* Level Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Level</Text>
        <View style={styles.levelInfoCard}>
          <Text style={styles.levelInfoText}>
            Tingkatkan level kamu dengan mengumpulkan poin dari:
          </Text>
          <View style={styles.levelInfoItem}>
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.levelInfoItemText}>
              Donasi ke kegiatan sosial
            </Text>
          </View>
          <View style={styles.levelInfoItem}>
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.levelInfoItemText}>Menjadi relawan aktif</Text>
          </View>
          <View style={styles.levelInfoItem}>
            <MaterialIcons name="check-circle" size={20} color="#10B981" />
            <Text style={styles.levelInfoItemText}>
              Membuka badge pencapaian
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyText: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "#10B981",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerGradient: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
  },
  pointsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pointsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  pointsItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: "#E5E7EB",
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 8,
  },
  levelValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
  },
  pointsLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  progressSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  progressPoints: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressRemaining: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "center",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  statCard: {
    width: "50%",
    padding: 6,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: "#9CA3AF",
  },
  achievementDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  achievementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementPoints: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  achievementPointsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
  },
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  emptyAchievements: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
  },
  emptyAchievementsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  emptyAchievementsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  levelInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  levelInfoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  levelInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  levelInfoItemText: {
    fontSize: 14,
    color: "#374151",
  },
  bottomPadding: {
    height: 24,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
