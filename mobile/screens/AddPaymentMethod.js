import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../constant";
import Toast from "react-native-toast-message";

export default function AddPaymentMethod({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleWebViewMessage = async (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message:", data);

      if (data.type === "CARD_TOKEN") {
        setLoading(true);
        const token = await AsyncStorage.getItem("access_token");

        const response = await axios.post(
          `${BASE_URL}/api/subscriptions/payment-method`,
          {
            type: "CARD",
            tokenId: data.tokenId,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Payment method added:", response.data);

        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Payment method added successfully!",
        });

        navigation.goBack();
      } else if (data.type === "ERROR") {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: data.message || "Failed to tokenize card",
        });
      }
    } catch (error) {
      console.error("Add payment method error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to add payment method",
      });
    } finally {
      setLoading(false);
    }
  };

  // HTML untuk tokenize kartu menggunakan Xendit.js
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            padding: 20px;
            background: #F9FAFB;
          }
          
          .container {
            max-width: 500px;
            margin: 0 auto;
          }
          
          .card {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 8px;
          }
          
          .subtitle {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 24px;
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
          }
          
          input {
            width: 100%;
            padding: 12px;
            border: 1px solid #D1D5DB;
            border-radius: 8px;
            font-size: 16px;
            color: #111827;
          }
          
          input:focus {
            outline: none;
            border-color: #10B981;
          }
          
          .row {
            display: flex;
            gap: 12px;
          }
          
          .col {
            flex: 1;
          }
          
          .submit-btn {
            width: 100%;
            background: #10B981;
            color: white;
            border: none;
            padding: 14px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 8px;
          }
          
          .submit-btn:active {
            background: #059669;
          }
          
          .submit-btn:disabled {
            background: #D1D5DB;
            cursor: not-allowed;
          }
          
          .error {
            color: #EF4444;
            font-size: 14px;
            margin-top: 8px;
            display: none;
          }
          
          .error.show {
            display: block;
          }
          
          .security-note {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #F3F4F6;
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
          }
          
          .security-note svg {
            flex-shrink: 0;
          }
          
          .security-note p {
            font-size: 12px;
            color: #6B7280;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1 class="title">Tambah Kartu Kredit/Debit</h1>
            <p class="subtitle">Data kartu Anda akan dienkripsi dengan aman</p>
            
            <form id="cardForm">
              <div class="form-group">
                <label for="cardNumber">Nomor Kartu</label>
                <input 
                  type="text" 
                  id="cardNumber" 
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  inputmode="numeric"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="cardName">Nama Pemegang Kartu</label>
                <input 
                  type="text" 
                  id="cardName" 
                  placeholder="NAMA SESUAI KARTU"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="cardEmail">Email</label>
                <input 
                  type="email" 
                  id="cardEmail" 
                  placeholder="email@example.com"
                  inputmode="email"
                  required
                >
              </div>
              
              <div class="row">
                <div class="col">
                  <div class="form-group">
                    <label for="expMonth">Bulan Kadaluarsa</label>
                    <input 
                      type="text" 
                      id="expMonth" 
                      placeholder="MM"
                      maxlength="2"
                      inputmode="numeric"
                      required
                    >
                  </div>
                </div>
                
                <div class="col">
                  <div class="form-group">
                    <label for="expYear">Tahun Kadaluarsa</label>
                    <input 
                      type="text" 
                      id="expYear" 
                      placeholder="YY"
                      maxlength="2"
                      inputmode="numeric"
                      required
                    >
                  </div>
                </div>
                
                <div class="col">
                  <div class="form-group">
                    <label for="cvv">CVV</label>
                    <input 
                      type="text" 
                      id="cvv" 
                      placeholder="123"
                      maxlength="4"
                      inputmode="numeric"
                      required
                    >
                  </div>
                </div>
              </div>
              
              <div class="error" id="errorMessage"></div>
              
              <button type="submit" class="submit-btn" id="submitBtn">
                Simpan Kartu
              </button>
              
              <div class="security-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <p>Data kartu Anda dienkripsi dan tidak disimpan di server kami. Proses pembayaran menggunakan Xendit yang telah tersertifikasi PCI DSS.</p>
              </div>
            </form>
          </div>
        </div>
        
        <script src="https://js.xendit.co/v1/xendit.min.js"></script>
        <script>
          // IMPORTANT: Ganti dengan Public Key Xendit Anda
          Xendit.setPublishableKey('xnd_public_development_huXnrw_PvnOTtkMGAY9H27fs2RmJvgLvyVAW5CeWEFeFTSwbjZZlFiq5fjEav3D');
          
          const form = document.getElementById('cardForm');
          const submitBtn = document.getElementById('submitBtn');
          const errorMessage = document.getElementById('errorMessage');
          const cardNumberInput = document.getElementById('cardNumber');
          
          // Format card number dengan spasi
          cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
          });
          
          function showError(message) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
          }
          
          function hideError() {
            errorMessage.classList.remove('show');
          }
          
          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Memproses...';
            
            const fullName = document.getElementById('cardName').value.trim();
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || 'CARDHOLDER';
            const lastName = nameParts.slice(1).join(' ') || 'NAME';
            
            const cardData = {
              card_number: document.getElementById('cardNumber').value.replace(/\\s/g, ''),
              card_exp_month: document.getElementById('expMonth').value,
              card_exp_year: '20' + document.getElementById('expYear').value,
              card_cvn: document.getElementById('cvv').value,
              card_holder_first_name: firstName,
              card_holder_last_name: lastName,
              card_holder_email: document.getElementById('cardEmail').value,
              is_multiple_use: true,
              should_authenticate: false
            };
            
            try {
              Xendit.card.createToken(cardData, (err, response) => {
                if (err) {
                  console.error('Xendit error:', err);
                  showError(err.message || 'Gagal memproses kartu. Periksa kembali data Anda.');
                  
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'ERROR',
                    message: err.message || 'Failed to tokenize card'
                  }));
                  
                  submitBtn.disabled = false;
                  submitBtn.textContent = 'Simpan Kartu';
                  return;
                }
                
                console.log('Token created:', response.id);
                
                // Kirim token ke React Native
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'CARD_TOKEN',
                  tokenId: response.id,
                  cardInfo: {
                    last4: cardData.card_number.slice(-4),
                    brand: response.card_info?.brand || 'CARD'
                  }
                }));
              });
            } catch (error) {
              console.error('Error:', error);
              showError('Terjadi kesalahan. Silakan coba lagi.');
              submitBtn.disabled = false;
              submitBtn.textContent = 'Simpan Kartu';
            }
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Metode Pembayaran</Text>
        <View style={{ width: 40 }} />
      </View>

      <WebView
        source={{ html: htmlContent }}
        onMessage={handleWebViewMessage}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading form...</Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.overlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingCardText}>Menyimpan kartu...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    minWidth: 200,
  },
  loadingCardText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
});
