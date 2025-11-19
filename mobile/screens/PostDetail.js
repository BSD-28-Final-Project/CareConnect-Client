import { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../constant";
import { WebView } from "react-native-webview";

const { width } = Dimensions.get("window");

function formatRp(value = 0) {
  return "Rp " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function PostDetail({ route, navigation }) {
  const { id } = route.params;
  const [post, setPost] = useState(null);
  const [news, setNews] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadData();
    loadUserEmail();
  }, [id]);

  const loadUserEmail = async () => {
    try {
      const email = await AsyncStorage.getItem("user_email");
      setUserEmail(email || "");
    } catch (err) {
      console.error("Failed to load email:", err);
    }
  };

  const loadData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem("user_id");
      setUserId(storedUserId);

      const storedUserName = await AsyncStorage.getItem("user_name");
      setUserName(storedUserName);

      // Fetch activity detail
      const { data: activityData } = await axios.get(
        `${BASE_URL}/api/activities/${id}`
      );

      console.log("activityData:", JSON.stringify(activityData, null, 2));

      setPost(activityData.data);

      // Check if user is already a volunteer
      if (storedUserId && activityData.data.listVolunteer) {
        const isAlreadyVolunteer = activityData.data.listVolunteer.some(
          (v) => v._id === storedUserId || v.userId === storedUserId
        );
        setIsVolunteer(isAlreadyVolunteer);
      }

      // Fetch news
      try {
        const { data: newsData } = await axios.get(
          `${BASE_URL}/api/news/activity/${id}`
        );

        console.log("newsData:", JSON.stringify(newsData, null, 2));

        setNews(newsData.data || []);
      } catch (err) {
        console.log("No news found");
      }

      // Fetch expenses
      try {
        const { data: expensesData } = await axios.get(
          `${BASE_URL}/api/expenses/activity/${id}`
        );

        // console.log("expensesData:", JSON.stringify(expensesData, null, 2));

        setExpenses(expensesData.data || []);
      } catch (err) {
        console.log("No expenses found");
      }

      // Fetch donations (if user is logged in)
      if (storedUserId) {
        try {
          const { data: donationsData } = await axios.get(
            `${BASE_URL}/api/donations`
          );
          const activityDonations = donationsData.data?.filter(
            (d) => d.activityId === id
          );

          // console.log("dontationData:", JSON.stringify(donationsData, null, 2));

          setDonations(activityDonations || []);
        } catch (err) {
          console.log("No donations found");
        }
      }
    } catch (error) {
      console.error("Load data error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load activity details",
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteer = async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please login to become a volunteer",
      });
      navigation.navigate("Login");
      return;
    }

    try {
      if (isVolunteer) {
        // Remove volunteer
        const volunteer = post.listVolunteer.find(
          (v) => v._id === userId || v.userId === userId
        );
        if (!volunteer) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Volunteer not found",
          });
          return;
        }

        await axios.delete(
          `${BASE_URL}/api/activities/${id}/volunteer/${volunteer._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "You are no longer a volunteer",
        });
        setIsVolunteer(false);
        loadData();
      } else {
        // Add volunteer
        await axios.post(
          `${BASE_URL}/api/activities/${id}/volunteer`,
          {
            userId: userId,
            name: userName,
            phone: "08123456789",
            note: "Saya ingin membantu sebagai volunteer",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "You are now a volunteer!",
        });
        setIsVolunteer(true);
        loadData();
      }
    } catch (error) {
      console.error("Volunteer error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message || "Failed to update volunteer status",
      });
    }
  };

  const handleDonate = async () => {
    const token = await AsyncStorage.getItem("access_token");
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Login Required",
        text2: "Please login to donate",
      });
      navigation.navigate("Login");
      return;
    }

    if (!userEmail) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Email not found. Please re-login.",
      });
      return;
    }

    Alert.prompt(
      "Donasi",
      "Masukkan jumlah donasi (Rp)",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Donate",
          onPress: async (amount) => {
            if (!amount || isNaN(amount) || Number(amount) <= 0) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please enter a valid amount",
              });
              return;
            }

            try {
              // POST ke backend untuk membuat invoice Xendit
              const { data } = await axios.post(
                `${BASE_URL}/api/donations`,
                {
                  activityId: id,
                  payerEmail: userEmail,
                  userId: userId,
                  amount: Number(amount),
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              // Backend harus return { invoiceUrl: "https://checkout.xendit.co/..." }
              if (data.invoiceUrl) {
                setPaymentUrl(data.invoiceUrl);
                setShowWebView(true);
              } else {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Payment URL not found",
                });
              }
            } catch (error) {
              console.error("Donation error:", error);
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  error.response?.data?.message || "Failed to create invoice",
              });
            }
          },
        },
      ],
      "plain-text",
      "",
      "numeric"
    );
  };

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;

    // Deteksi callback URL dari Xendit (sesuaikan dengan successRedirectUrl di backend)
    if (url.includes("/payment/success")) {
      setShowWebView(false);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Payment successful! Thank you for your donation.",
      });
      loadData(); // Refresh data
    } else if (
      url.includes("/payment/failed") ||
      url.includes("/payment/cancel")
    ) {
      setShowWebView(false);
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: "Your payment was cancelled or failed.",
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#047857" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Activity not found</Text>
      </View>
    );
  }

  const progressPercent =
    post.targetMoney > 0 ? (post.collectedMoney / post.targetMoney) * 100 : 0;

  const daysLeft = post.deadline
    ? Math.max(
        0,
        Math.ceil(
          (new Date(post.deadline) - new Date()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          {post.images && post.images.length > 0 ? (
            <Image
              source={{ uri: post.images[0] }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <MaterialIcons name="image" size={80} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <MaterialIcons name="circle" size={8} color="#047857" />
            <Text style={styles.categoryText}>{post.category || "Acara"}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{post.title}</Text>

          {/* Location */}
          {post.location?.name && (
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={16} color="#6B7280" />
              <Text style={styles.locationText}>{post.location.name}</Text>
            </View>
          )}

          {/* Map WebView - OpenStreetMap */}
          {post.location?.lat && post.location?.lng && (
            <View style={styles.mapContainer}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                          crossorigin=""/>
                        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                          crossorigin=""></script>
                        <style>
                          body, html { margin: 0; padding: 0; height: 100%; }
                          #map { height: 100%; width: 100%; }
                        </style>
                      </head>
                      <body>
                        <div id="map"></div>
                        <script>
                          const map = L.map('map').setView([${post.location.lat}, ${post.location.lng}], 15);
                          
                          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            maxZoom: 19,
                            attribution: '© OpenStreetMap contributors'
                          }).addTo(map);
                          
                          L.marker([${post.location.lat}, ${post.location.lng}])
                            .addTo(map)
                            .bindPopup('${post.location.name || "Lokasi Kegiatan"}')
                            .openPopup();
                        </script>
                      </body>
                    </html>
                  `,
                }}
                style={styles.mapWebView}
                scrollEnabled={false}
                bounces={false}
              />
              <TouchableOpacity
                style={styles.openMapButton}
                onPress={() => {
                  const osmUrl = `https://www.openstreetmap.org/?mlat=${post.location.lat}&mlon=${post.location.lng}&zoom=15`;
                  Linking.openURL(osmUrl).catch(err => 
                    Alert.alert("Error", "Tidak bisa membuka OpenStreetMap")
                  );
                }}
              >
                <MaterialIcons name="open-in-new" size={16} color="#047857" />
                <Text style={styles.openMapText}>Buka di Maps</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Fundraising Section */}
          {post.targetMoney > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Target Dana</Text>

              <View style={styles.moneyRow}>
                <View>
                  <Text style={styles.collectedLabel}>Terkumpul</Text>
                  <Text style={styles.collectedAmount}>
                    {formatRp(post.collectedMoney)}
                  </Text>
                </View>
                <View style={styles.alignRight}>
                  <Text style={styles.targetLabel}>Target</Text>
                  <Text style={styles.targetAmount}>
                    {formatRp(post.targetMoney)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressWrap}>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${Math.min(progressPercent, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {progressPercent.toFixed(1)}%
                </Text>
              </View>

              {daysLeft !== null && (
                <Text style={styles.daysLeft}>{daysLeft} hari lagi</Text>
              )}
            </View>
          )}

          {/* Volunteers Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relawan</Text>
            <View style={styles.volunteersRow}>
              <MaterialIcons name="people" size={20} color="#047857" />
              <Text style={styles.volunteersText}>
                {post.collectedVolunteer || 0} relawan bergabung
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deskripsi</Text>
            <Text style={styles.description}>
              {post.description || "Tidak ada deskripsi."}
            </Text>
          </View>

          {/* News Section */}
          {news.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Berita Terkini</Text>
              {news.map((item, index) => (
                <View key={index} style={styles.newsItem}>
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text style={styles.newsContent}>{item.content}</Text>
                  <Text style={styles.newsDate}>
                    {new Date(item.createdAt).toLocaleDateString("id-ID")}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Expenses Section */}
          {expenses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pengeluaran</Text>
              {expenses.map((expense, index) => (
                <View key={index} style={styles.expenseItem}>
                  <View style={styles.expenseRow}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseAmount}>
                      {formatRp(expense.amount)}
                    </Text>
                  </View>
                  {expense.description && (
                    <Text style={styles.expenseDesc}>
                      {expense.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Donations Section */}
          {donations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Donasi Saya</Text>
              {donations.map((donation, index) => (
                <View key={index} style={styles.donationItem}>
                  <Text style={styles.donationAmount}>
                    {formatRp(donation.amount)}
                  </Text>
                  <Text style={styles.donationDate}>
                    {new Date(donation.createdAt).toLocaleDateString("id-ID")}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Volunteer List */}
          {post.listVolunteer && post.listVolunteer.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daftar Relawan</Text>
              {post.listVolunteer.map((volunteer, index) => (
                <View key={index} style={styles.volunteerItem}>
                  <MaterialIcons name="person" size={20} color="#6B7280" />
                  <Text style={styles.volunteerName}>
                    {volunteer.name || volunteer.username || "Anonymous"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.donateButton} onPress={handleDonate}>
          <MaterialIcons name="favorite" size={20} color="#FFFFFF" />
          <Text style={styles.donateButtonText}>Donasi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.volunteerButton,
            isVolunteer && styles.volunteerButtonActive,
          ]}
          onPress={handleVolunteer}
        >
          <MaterialIcons
            name={isVolunteer ? "check-circle" : "people"}
            size={20}
            color={isVolunteer ? "#FFFFFF" : "#047857"}
          />
          <Text
            style={[
              styles.volunteerButtonText,
              isVolunteer && styles.volunteerButtonTextActive,
            ]}
          >
            {isVolunteer ? "Sudah Bergabung" : "Jadi Relawan"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Xendit WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.modalContainer}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => setShowWebView(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Pembayaran</Text>
            <View style={{ width: 40 }} />
          </View>

          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color="#047857" />
              </View>
            )}
          />
        </View>
      </Modal>
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
  errorText: {
    fontSize: 16,
    color: "#6B7280",
  },
  imageContainer: {
    position: "relative",
    width: width,
    height: 280,
    backgroundColor: "#E5E7EB",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "#ECFDF5",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  categoryText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  backButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 32,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  mapWebView: {
    flex: 1,
  },
  openMapButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  openMapText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  section: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  collectedLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  collectedAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#047857",
  },
  alignRight: {
    alignItems: "flex-end",
  },
  targetLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  targetAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  progressWrap: {
    marginBottom: 8,
  },
  progressBg: {
    height: 10,
    backgroundColor: "#ECFDF5",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#047857",
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  daysLeft: {
    fontSize: 14,
    color: "#EF4444",
    marginTop: 8,
    fontWeight: "500",
  },
  volunteersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  volunteersText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 8,
    fontWeight: "500",
  },
  description: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
  },
  newsItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 12,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  newsContent: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  expenseItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 12,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: "#047857",
  },
  expenseDesc: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  donationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  donationAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#047857",
  },
  donationDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  volunteerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  volunteerName: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },
  actionBar: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  donateButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#047857",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  donateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  volunteerButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ECFDF5",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#047857",
  },
  volunteerButtonActive: {
    backgroundColor: "#047857",
    borderColor: "#047857",
  },
  volunteerButtonText: {
    color: "#047857",
    fontSize: 16,
    fontWeight: "600",
  },
  volunteerButtonTextActive: {
    color: "#FFFFFF",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  webViewLoading: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -20,
    marginTop: -20,
  },
});
