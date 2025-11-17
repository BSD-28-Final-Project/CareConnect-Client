import { useState } from "react";
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
import Toast from "react-native-toast-message";
import axios from "axios";
import { BASE_URL } from "../constant";

export default function Register({ navigation }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRegister = async () => {
    const { name, email, password } = formData;

    if (!name || !email || !password) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "name, email and password are required",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BASE_URL}/api/users/register`, {
        name,
        email,
        password,
      });

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Registration successful! Please login.",
      });

      navigation.replace("Login");
    } catch (error) {
      console.error("Register error:", error);
      Toast.show({
        type: "error",
        text1: "Registration Failed",
        text2: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🤝</Text>
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="name"
              value={formData.name}
              onChangeText={(value) => handleChange("name", value)}
              autoCapitalize="none"
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {/* <TextInput
              style={styles.input}
              placeholder="Phone Number (optional)"
              value={formData.phoneNumber}
              onChangeText={(value) => handleChange("phoneNumber", value)}
              keyboardType="phone-pad"
              editable={!loading}
            /> */}

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(value) => handleChange("password", value)}
              secureTextEntry
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Register</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                disabled={loading}
              >
                <Text style={styles.link}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  form: {
    width: "100%",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#047857",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#047857",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  link: {
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
  },
});
