import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import axios from "axios";
import { BASE_URL } from "../constant";

export default function EditProfile({ navigation, route }) {
  const initial = route?.params || {};
  const [name, setName] = useState(initial.username || "");
  const [email, setEmail] = useState(initial.email || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // try to prefill from AsyncStorage if not provided
    (async () => {
      if (!name) {
        const stored = await AsyncStorage.getItem("username");
        if (stored) setName(stored);
      }
      if (!email) {
        const storedE = await AsyncStorage.getItem("email");
        if (storedE) setEmail(storedE);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!name) {
      Toast.show({ type: "error", text1: "Error", text2: "Name is required" });
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      
      // Try to update backend profile
      let backendSuccess = false;
      if (token) {
        try {
          console.log("Updating profile with name:", name);
          const response = await axios.put(
            `${BASE_URL}/api/users/profile`,
            { name },
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
              } 
            }
          );
          console.log("Backend update success:", response.data);
          backendSuccess = true;
        } catch (backendError) {
          console.error("Backend update failed:", backendError.response?.status, backendError.response?.data || backendError.message);
          // Don't throw - continue to save locally
        }
      }

      // Save locally so other screens can read (even if backend fails)
      await AsyncStorage.setItem("username", name);

      if (backendSuccess) {
        Toast.show({ type: "success", text1: "Success", text2: "Profile updated" });
      } else {
        Toast.show({ type: "success", text1: "Saved Locally", text2: "Profile updated on device (backend sync pending)" });
      }
      
      // Navigate back to MyTabs - Profile will auto-refresh with useFocusEffect
      navigation.navigate("MyTabs");
    } catch (error) {
      console.error("Update profile error:", error);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Text style={styles.subtitle}>Update your profile information</Text>
          </View>

          <View style={styles.form}>
            <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} editable={!loading} />
            <TextInput style={[styles.input, styles.inputDisabled]} placeholder="Email" value={email} editable={false} />

            <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Save</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6B7280", marginTop: 6 },
  form: { width: "100%", marginTop: 12 },
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  inputDisabled: { backgroundColor: "#F3F4F6", color: "#9CA3AF" },
  button: { backgroundColor: "#047857", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, shadowColor: "#047857", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  buttonDisabled: { backgroundColor: "#9CA3AF" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancel: { marginTop: 12, alignItems: "center" },
  cancelText: { color: "#6B7280" },
});
