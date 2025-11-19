import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../constant";

function formatRp(value = 0) {
  return "Rp " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Donation({ navigation }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadDonations();
    }, [])
  );

  const loadDonations = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("user_id");
      const token = await AsyncStorage.getItem("access_token");

      if (!storedUserId || !token) {
        setLoading(false);
        return;
      }

      setUserId(storedUserId);

      const { data } = await axios.get(
        `${BASE_URL}/api/donations?userId=${storedUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Donations loaded:", JSON.stringify(data, null, 2));
      setDonations(data.data || data || []);
    } catch (error) {
      console.error("Load donations error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load donations",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDonations();
  };

  const handleDonationPress = (donation) => {
    if (donation.activityId) {
      navigation.navigate("PostDetail", { id: donation.activityId });
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "settled":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "expired":
      case "failed":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "settled":
        return "Berhasil";
      case "pending":
        return "Menunggu";
      case "expired":
        return "Kadaluarsa";
      case "failed":
        return "Gagal";
      default:
        return status || "Unknown";
    }
  };

  const renderDonationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.donationCard}
      onPress={() => handleDonationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="favorite" size={24} color="#EF4444" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.activityTitle} numberOfLines={2}>
            {item.activity?.title}
          </Text>
          <Text style={styles.donationDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBody}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Jumlah Donasi</Text>
          <Text style={styles.amountValue}>{formatRp(item.amount)}</Text>
        </View>

        {item.status && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + "20" },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        )}

        {item.invoiceId && (
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Invoice ID</Text>
            <Text style={styles.invoiceValue} numberOfLines={1}>
              {item.invoiceId}
            </Text>
          </View>
        )}
      </View>

      {item.activityId && (
        <TouchableOpacity
          style={styles.viewActivityButton}
          onPress={() => handleDonationPress(item)}
        >
          <Text style={styles.viewActivityText}>Lihat Kegiatan</Text>
          <MaterialIcons name="chevron-right" size={20} color="#047857" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialIcons name="favorite-border" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Belum Ada Donasi</Text>
      <Text style={styles.emptyText}>
        Anda belum melakukan donasi.{"\n"}Mulai berdonasi untuk membantu sesama!
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={styles.browseButtonText}>Jelajahi Kegiatan</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={styles.loadingText}>Memuat donasi...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centered}>
        <View style={styles.emptyIconCircle}>
          <MaterialIcons name="login" size={64} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>Login Diperlukan</Text>
        <Text style={styles.emptyText}>
          Silakan login untuk melihat riwayat donasi Anda
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Donasi</Text>
        <Text style={styles.headerSubtitle}>
          {donations.length} donasi tercatat
        </Text>
      </View>

      <FlatList
        data={donations}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderDonationItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          donations.length === 0 ? styles.emptyList : styles.list
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#047857"]}
            tintColor="#047857"
          />
        }
      />
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  donationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  donationDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  cardBody: {
    padding: 16,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#047857",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  invoiceValue: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "monospace",
  },
  viewActivityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  viewActivityText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#047857",
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: "#047857",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#047857",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#047857",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
