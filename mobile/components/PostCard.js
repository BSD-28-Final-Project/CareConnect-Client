// ...existing code...
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

function formatRp(value = 0) {
  return "Rp " + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function PostCard({ post, onPress }) {
  const current = post.collectedMoney ?? 0;
  const target = post.targetMoney ?? 0;
  const progressPercent = target > 0 ? (current / target) * 100 : 0;

  const daysLeft =
    post.daysLeft ??
    (post.deadline
      ? Math.max(
          0,
          Math.ceil(
            (new Date(post.deadline) - new Date()) / (1000 * 60 * 60 * 24)
          )
        )
      : null);

  const category = post.category ?? "Acara";
  const volunteers = post.collectedVolunteer ?? 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {post.images && post.images[0] ? (
          <Image source={{ uri: post.images[0] }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        {/* Category badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{category}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        {/* Time + Amount row */}
        <View style={styles.rowBetween}>
          <Text style={styles.smallText}>
            {daysLeft != null ? `${daysLeft} hari lagi` : ""}
          </Text>
          <Text style={styles.smallTextRight}>{formatRp(target)}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(progressPercent, 100)}%` },
              ]}
            />
          </View>
        </View>

        {/* Volunteers row */}
        <View style={styles.volunteersRow}>
          <MaterialIcons name="people" size={16} color="#6B7280" />
          <Text style={styles.volunteersText}>{volunteers} volunteers</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
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
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  smallText: {
    fontSize: 12,
    color: "#6B7280",
  },
  smallTextRight: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "600",
  },
  progressWrap: {
    marginBottom: 12,
  },
  progressBg: {
    height: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#047857",
    borderRadius: 6,
  },
  volunteersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  volunteersText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
    fontWeight: "500",
  },

  /* legacy styles kept for compatibility */
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  author: {
    fontSize: 14,
    color: "#047857",
    fontWeight: "500",
  },
  date: {
    fontSize: 12,
    color: "#6B7280",
  },
  stats: {
    flexDirection: "row",
    marginBottom: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 6,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    fontSize: 12,
    color: "#047857",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginTop: 4,
  },
});
