import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../constant";
import Toast from "react-native-toast-message";

function formatRp(value = 0) {
  return "Rp " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Subscription({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        setIsLoggedIn(false);
        // Still load plans for non-logged in users
        try {
          const { data: plansData } = await axios.get(
            `${BASE_URL}/api/subscriptions/plans`
          );
          setPlans(plansData.data || []);
        } catch (err) {
          console.log("Plans error:", err);
        }
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      // Load subscription plans
      try {
        const { data: plansData } = await axios.get(
          `${BASE_URL}/api/subscriptions/plans`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPlans(plansData.data || []);
      } catch (err) {
        console.log("Plans error:", err);
      }

      // Load user subscription
      try {
        const { data: subData } = await axios.get(
          `${BASE_URL}/api/subscriptions/my-subscription`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubscription(subData.data || null);
      } catch (err) {
        console.log("No active subscription");
        setSubscription(null);
      }

      // Check payment method
      try {
        const { data: pmData } = await axios.get(
          `${BASE_URL}/api/subscriptions/payment-methods`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setHasPaymentMethod(pmData.data && pmData.data.length > 0);
      } catch (err) {
        console.log("No payment method");
        setHasPaymentMethod(false);
      }
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSubscribe = async (planId, amount) => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please login to subscribe",
      });
      navigation.navigate("Login");
      return;
    }

    if (!hasPaymentMethod) {
      Alert.alert(
        "Payment Method Required",
        "You need to add a payment method first. Would you like to add one now?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Payment Method",
            onPress: () => navigation.navigate("AddPaymentMethod"),
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Confirm Subscription",
      `Subscribe for ${formatRp(amount)}/month?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          onPress: async () => {
            try {
              await axios.post(
                `${BASE_URL}/api/subscriptions`,
                {
                  planId,
                  amount,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Subscription activated!",
              });
              loadData();
            } catch (error) {
              console.error("Subscribe error:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  error.response?.data?.message ||
                  "Failed to create subscription",
              });
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You will lose all premium benefits.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("access_token");
              await axios.delete(`${BASE_URL}/api/subscriptions`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Subscription cancelled",
              });
              loadData();
            } catch (error) {
              console.error("Cancel error:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  error.response?.data?.message ||
                  "Failed to cancel subscription",
              });
            }
          },
        },
      ]
    );
  };

  const getPlanIcon = (planName) => {
    switch (planName?.toLowerCase()) {
      case "basic":
        return "star-outline";
      case "premium":
        return "star-half";
      case "gold":
        return "star";
      default:
        return "card-membership";
    }
  };

  const getPlanColor = (planName) => {
    switch (planName?.toLowerCase()) {
      case "basic":
        return "#6B7280";
      case "premium":
        return "#3B82F6";
      case "gold":
        return "#F59E0B";
      default:
        return "#10B981";
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading...</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="card-membership" size={48} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Langganan Premium</Text>
        <Text style={styles.headerSubtitle}>
          Dukung kegiatan sosial secara rutin setiap bulan
        </Text>
      </View>

      {/* Not Logged In State */}
      {!isLoggedIn && (
        <View style={styles.notLoggedInCard}>
          <MaterialIcons name="login" size={64} color="#10B981" />
          <Text style={styles.notLoggedInTitle}>Login Diperlukan</Text>
          <Text style={styles.notLoggedInText}>
            Silakan login untuk berlangganan dan mendukung kegiatan sosial
            secara rutin
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <MaterialIcons name="login" size={20} color="#FFFFFF" />
            <Text style={styles.loginButtonText}>Login Sekarang</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Active Subscription - Only show when logged in */}
      {isLoggedIn && subscription && (
        <View style={styles.activeSubscriptionCard}>
          <View style={styles.activeHeader}>
            <View style={styles.activeBadge}>
              <MaterialIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.activeBadgeText}>AKTIF</Text>
            </View>
            <Text style={styles.activeStatus}>{subscription.status}</Text>
          </View>

          <View style={styles.activeContent}>
            <Text style={styles.activePlanName}>
              {subscription.plan?.name || "Premium Plan"}
            </Text>
            <Text style={styles.activeAmount}>
              {formatRp(subscription.amount)}/bulan
            </Text>
          </View>

          <View style={styles.activeDetails}>
            <View style={styles.activeDetailRow}>
              <MaterialIcons name="event" size={16} color="#6B7280" />
              <Text style={styles.activeDetailText}>
                Mulai: {formatDate(subscription.startDate)}
              </Text>
            </View>
            {subscription.nextBillingDate && (
              <View style={styles.activeDetailRow}>
                <MaterialIcons name="event-repeat" size={16} color="#6B7280" />
                <Text style={styles.activeDetailText}>
                  Pembayaran Berikutnya:{" "}
                  {formatDate(subscription.nextBillingDate)}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
          >
            <MaterialIcons name="cancel" size={20} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Batalkan Langganan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Method Info - Only show when logged in */}
      {isLoggedIn && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={24} color="#111827" />
            <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
          </View>

          {hasPaymentMethod ? (
            <View style={styles.paymentMethodCard}>
              <MaterialIcons name="credit-card" size={32} color="#10B981" />
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodTitle}>Kartu Tersimpan</Text>
                <Text style={styles.paymentMethodSubtitle}>
                  Metode pembayaran aktif
                </Text>
              </View>
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </View>
          ) : (
            <View style={styles.noPaymentMethod}>
              <MaterialIcons name="info-outline" size={24} color="#F59E0B" />
              <Text style={styles.noPaymentMethodText}>
                Tambahkan metode pembayaran untuk berlangganan
              </Text>
              <TouchableOpacity
                style={styles.addPaymentButton}
                onPress={() => navigation.navigate("AddPaymentMethod")}
              >
                <MaterialIcons name="add-card" size={20} color="#FFFFFF" />
                <Text style={styles.addPaymentButtonText}>
                  Tambah Metode Pembayaran
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Subscription Plans */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pilih Paket Langganan</Text>
        <Text style={styles.sectionSubtitle}>
          Kontribusi rutin Anda akan membantu kegiatan sosial berkelanjutan
        </Text>

        {plans.length > 0 ? (
          plans.map((plan) => (
            <View
              key={plan._id}
              style={[
                styles.planCard,
                isLoggedIn &&
                  subscription?.plan?._id === plan._id &&
                  styles.planCardActive,
              ]}
            >
              <View style={styles.planHeader}>
                <View
                  style={[
                    styles.planIconContainer,
                    { backgroundColor: `${getPlanColor(plan.name)}20` },
                  ]}
                >
                  <MaterialIcons
                    name={getPlanIcon(plan.name)}
                    size={32}
                    color={getPlanColor(plan.name)}
                  />
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>
                    {formatRp(plan.amount)}/bulan
                  </Text>
                </View>
              </View>

              {plan.description && (
                <Text style={styles.planDescription}>{plan.description}</Text>
              )}

              {plan.benefits && plan.benefits.length > 0 && (
                <View style={styles.benefitsList}>
                  {plan.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <MaterialIcons name="check" size={20} color="#10B981" />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              )}

              {isLoggedIn && subscription?.plan?._id === plan._id ? (
                <View style={styles.currentPlanBadge}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color="#10B981"
                  />
                  <Text style={styles.currentPlanText}>Paket Aktif</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: getPlanColor(plan.name) },
                  ]}
                  onPress={() =>
                    isLoggedIn
                      ? handleSubscribe(plan._id, plan.amount)
                      : navigation.navigate("Login")
                  }
                  disabled={isLoggedIn && !!subscription}
                >
                  <Text style={styles.subscribeButtonText}>
                    {!isLoggedIn
                      ? "Login untuk Berlangganan"
                      : subscription
                      ? "Sudah Berlangganan"
                      : "Pilih Paket"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyPlans}>
            <MaterialIcons name="inbox" size={48} color="#D1D5DB" />
            <Text style={styles.emptyPlansText}>Belum ada paket tersedia</Text>
          </View>
        )}
      </View>

      {/* Benefits Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Keuntungan Berlangganan</Text>
        <View style={styles.benefitsInfo}>
          <View style={styles.benefitInfoItem}>
            <MaterialIcons name="favorite" size={24} color="#EF4444" />
            <Text style={styles.benefitInfoText}>
              Kontribusi otomatis setiap bulan
            </Text>
          </View>
          <View style={styles.benefitInfoItem}>
            <MaterialIcons name="shield" size={24} color="#10B981" />
            <Text style={styles.benefitInfoText}>
              Pembayaran aman & terpercaya
            </Text>
          </View>
          <View style={styles.benefitInfoItem}>
            <MaterialIcons name="cancel" size={24} color="#F59E0B" />
            <Text style={styles.benefitInfoText}>
              Bisa dibatalkan kapan saja
            </Text>
          </View>
          <View style={styles.benefitInfoItem}>
            <MaterialIcons name="receipt-long" size={24} color="#3B82F6" />
            <Text style={styles.benefitInfoText}>
              Laporan transparansi penggunaan dana
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    backgroundColor: "#10B981",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#D1FAE5",
    marginTop: 8,
    textAlign: "center",
  },
  notLoggedInCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  notLoggedInTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  notLoggedInText: {
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
  activeSubscriptionCard: {
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
    borderWidth: 2,
    borderColor: "#10B981",
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  activeStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "capitalize",
  },
  activeContent: {
    marginBottom: 16,
  },
  activePlanName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  activeAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10B981",
  },
  activeDetails: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  activeDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeDetailText: {
    fontSize: 14,
    color: "#6B7280",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  noPaymentMethod: {
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  noPaymentMethodText: {
    fontSize: 14,
    color: "#92400E",
    marginTop: 8,
    marginBottom: 12,
    textAlign: "center",
  },
  addPaymentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addPaymentButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardActive: {
    borderColor: "#10B981",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  planIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
  },
  planDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  benefitsList: {
    gap: 8,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  currentPlanBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  currentPlanText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  emptyPlans: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
  },
  emptyPlansText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 12,
  },
  benefitsInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  benefitInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitInfoText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  bottomPadding: {
    height: 24,
  },
});
