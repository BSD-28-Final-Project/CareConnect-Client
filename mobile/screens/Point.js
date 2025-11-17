import { View, Text, StyleSheet } from "react-native";

export default function Point() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Point Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  text: {
    fontSize: 18,
    color: "#6B7280",
  },
});
