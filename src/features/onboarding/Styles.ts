import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF5F2",
  },

  /* GREEN HEADER */
  header: {
    backgroundColor: "#3AB8A5",
    paddingTop: 48,
    paddingBottom: 68,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: { fontSize: 18 },

  headerTitle: {
    marginTop: 14,
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  /* AVATAR FLOATING */
  avatarHolder: {
    position: "absolute",
    top: 86,
    alignSelf: "center",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    elevation: 4,
  },

  avatarImage: {
    width: 66,
    height: 66,
    resizeMode: "contain",
  },

  /* FLOATING WHITE CARD */
  card: {
    marginTop: 70,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    paddingTop: 60,
    elevation: 3,
  },

  label: {
    marginTop: 12,
    marginBottom: 6,
    color: "#6B7280",
    fontSize: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#DADDE2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  /* GRID */
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },

  col: { flex: 1 },

  /* CHIPS */
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DADDE2",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  chipActive: {
    borderColor: "#3AB8A5",
    backgroundColor: "#E8F7F3",
  },

  chipText: { fontSize: 14 },

  /* CTA */
  submitBtn: {
    marginTop: 24,
    backgroundColor: "#3AB8A5",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  submitDisabled: { opacity: 0.4 },

  submitText: { color: "#fff", fontWeight: "600" },
});
