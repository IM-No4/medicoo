import AppIcon from "@/src/components/icons/AppIcon";
import { uploadPrescription } from "@/src/services/api/prescription.api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  Scan,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  User,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDoctorName } from "../../utils/formatters";

const { width, height } = Dimensions.get("window");

export default function PrescriptionResultScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    result: initialResult,
    image: passedImage,
    latitude,
    longitude,
    storeId,
  } = route.params || {};

  const [loading, setLoading] = useState(!initialResult);
  const [result, setResult] = useState(initialResult);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState(
    "Initializing analyzer...",
  );

  // Animations
  const scanAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!initialResult && passedImage) {
      handleProcessing();
    } else if (initialResult) {
      triggerEntranceAnimation();
    }
  }, []);

  const triggerEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  };

  const handleProcessing = async () => {
    setLoading(true);
    startScanAnimation();
    setError(null);
    setProcessingStatus("Reading your prescription...");

    try {
      // Small delays to make it feel like it's actually "thinking" and "detecting"
      setTimeout(
        () => setProcessingStatus("Extracting doctor information..."),
        1500,
      );
      setTimeout(() => setProcessingStatus("Verifying authenticity..."), 3000);
      setTimeout(
        () => setProcessingStatus("Finding your medicines nearby..."),
        4500,
      );

      const res = await uploadPrescription({
        prescriptionImage: passedImage,
        latitude: latitude,
        longitude: longitude,
        storeId: storeId,
      });

      if (res.success) {
        setResult(res.data);
        setLoading(false);
        triggerEntranceAnimation();
      } else {
        throw new Error(res.message || "Failed to process prescription");
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Something went wrong during analysis.";
      setError(msg);
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <View
        style={[
          styles.processingContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={["#0F172A", "#1E293B"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.loadingHeader}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backFab}
          >
            <XCircle color="rgba(255,255,255,0.6)" size={28} />
          </TouchableOpacity>
        </View>

        <View style={styles.imagePreviewWrapper}>
          <Image
            source={{ uri: passedImage.uri }}
            style={styles.processingImage}
          />
          <Animated.View
            style={[
              styles.scanLine,
              {
                top: scanAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          >
            <LinearGradient
              colors={["transparent", "rgba(47, 165, 97, 0.4)", "transparent"]}
              style={styles.lineGlow}
            />
          </Animated.View>
          <View style={styles.overlayText}>
            <Scan color="#2FA561" size={40} />
            <Text style={styles.scanningLabel}>SCANNING</Text>
          </View>
        </View>

        <View style={styles.loadingFooter}>
          <View style={styles.progressBarBg}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: scanAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["10%", "90%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.statusText}>{processingStatus}</Text>
          <Text style={styles.subStatusText}>
            AI-Powered analysis in progress
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.errorFullContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <LinearGradient
          colors={["#ffffff", "#F8FAFC"]}
          style={StyleSheet.absoluteFill}
        />
        <AlertCircle color="#EF4444" size={64} strokeWidth={1.5} />
        <Text style={styles.errorFullTitle}>Analysis Failed</Text>
        <Text style={styles.errorFullMsg}>{error}</Text>
        <View style={styles.errorBtnRow}>
          <TouchableOpacity style={styles.retryBtn} onPress={handleProcessing}>
            <RefreshCw size={18} color="#fff" />
            <Text style={styles.retryBtnText}>Retry Analysis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backErrorBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backErrorText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const {
    pt_id,
    prescriptionDate,
    doctorName,
    patientName,
    prescriptionValidity,
    prescriptionAuthenticity,
    prescriptionStatus,
    stores,
  } = result;

  // Our own fraud engine can flag a prescription after OCR - 'revoked' means
  // it's auto-blocked (do not let the patient proceed to order at all),
  // 'pending_review' means a pharmacist has to clear it manually before
  // dispensing. Anything else (verified/uploaded/etc.) is the normal path.
  const isRevoked = prescriptionStatus === "revoked";
  const isPendingReview = prescriptionStatus === "pending_review";

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={[styles.masterContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.closeBtn}
          >
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.headerLabel}>Analysis Report</Text>
            <Text style={styles.headerId} numberOfLines={1}>
              {pt_id}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Visual Header */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: contentAnim }],
            }}
          >
            <LinearGradient
              colors={
                isRevoked
                  ? ["#EF4444", "#B91C1C"]
                  : isPendingReview
                    ? ["#F59E0B", "#B45309"]
                    : ["#2FA561", "#0E7439"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <View>
                  <Text style={styles.heroSub}>Verification Status</Text>
                  <Text style={styles.heroTitle}>
                    {isRevoked
                      ? "Could Not Be Verified"
                      : isPendingReview
                        ? "Pending Manual Review"
                        : "Authentic & Verified"}
                  </Text>
                </View>
                {isRevoked ? (
                  <ShieldAlert color="#fff" size={48} strokeWidth={1.5} />
                ) : isPendingReview ? (
                  <Clock color="#fff" size={48} strokeWidth={1.5} />
                ) : (
                  <ShieldCheck color="#fff" size={48} strokeWidth={1.5} />
                )}
              </View>
              <View style={styles.heroFooter}>
                <View style={styles.trustBadge}>
                  <CheckCircle size={14} color="#FFF" />
                  <Text style={styles.trustText}>AI Audited</Text>
                </View>
                <Text style={styles.timestamp}>
                  Analyzed{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </LinearGradient>
            {(isRevoked || isPendingReview) && (
              <View
                style={[
                  styles.reviewNotice,
                  isRevoked ? styles.reviewNoticeError : styles.reviewNoticeWarn,
                ]}
              >
                <Text style={styles.reviewNoticeText}>
                  {isRevoked
                    ? "We couldn't verify this prescription, so it can't be used to order medicines. Please upload a clearer photo of a valid, original prescription."
                    : "This prescription needs to be manually reviewed before it can be dispensed. You can still browse matching pharmacies, but your order may be held until review is complete."}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: contentAnim }],
            }}
          >
            {/* Metadata Card */}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Prescription Details</Text>
            </View>
            <View style={styles.glassCard}>
              <View style={styles.dataRow}>
                <View style={styles.iconCircle}>
                  <User size={18} color="#2FA561" />
                </View>
                <View style={styles.dataTexts}>
                  <Text style={styles.dataLabel}>Patient</Text>
                  <Text style={styles.dataVal}>
                    {patientName || "Identified Patient"}
                  </Text>
                </View>
              </View>
              <View style={styles.dataRow}>
                <View
                  style={[styles.iconCircle, { backgroundColor: "#EFF6FF" }]}
                >
                  <Stethoscope size={18} color="#2563EB" />
                </View>
                <View style={styles.dataTexts}>
                  <Text style={styles.dataLabel}>Doctor / Clinic</Text>
                  <Text style={styles.dataVal}>
                    {doctorName ? formatDoctorName(doctorName) : "Qualified Medical Practitioner"}
                  </Text>
                </View>
              </View>
              <View style={styles.dataRow}>
                <View
                  style={[styles.iconCircle, { backgroundColor: "#F0FDF4" }]}
                >
                  <Calendar size={18} color="#16A34A" />
                </View>
                <View style={styles.dataTexts}>
                  <Text style={styles.dataLabel}>Prescribed On</Text>
                  <Text style={styles.dataVal}>
                    {formatDate(prescriptionDate)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pharmacies Section - hidden entirely for a revoked/blocked
                prescription, since there's nothing valid to order against. */}
            {!isRevoked && (
              <>
            <View style={styles.sectionTitleRow}>
              <View style={styles.titleWithCount}>
                <Text style={styles.sectionTitle}>Pharmacies found</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>
                    {stores?.length || 0}
                  </Text>
                </View>
              </View>
            </View>

            {stores && stores.length > 0 ? (
              stores.map((store: any, idx: number) => (
                <TouchableOpacity
                  key={store.storeId ? `${store.storeId}-${idx}` : idx}
                  style={styles.storeCard}
                  onPress={() =>
                    navigation.navigate("PharmacyDetail", {
                      pharmacyId: store.storeId,
                    })
                  }
                >
                  <View style={styles.storeMain}>
                    <View style={styles.storeLogo}>
                      <LinearGradient
                        colors={["#F1F5F9", "#E2E8F0"]}
                        style={StyleSheet.absoluteFill}
                      />
                      <AppIcon name="shopping-bag" size={20} color="#64748B" />
                    </View>
                    <View style={styles.storeNameBox}>
                      <Text style={styles.storeName}>{store.storeName}</Text>
                      <View style={styles.distRow}>
                        <MapPin size={12} color="#94A3B8" />
                        <Text style={styles.storeDist}>
                          {store.distance} km away
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#CBD5E1" />
                  </View>

                  <View style={styles.medTagCloud}>
                    {store.medicines &&
                      store.medicines
                        .slice(0, 3)
                        .map((med: any, mIdx: number) => (
                          <View key={mIdx} style={styles.medTag}>
                            <View style={styles.medDot} />
                            <Text style={styles.medTagName}>{med.name}</Text>
                          </View>
                        ))}
                    {store.medicines && store.medicines.length > 3 && (
                      <Text style={styles.moreMeds}>
                        +{store.medicines.length - 3} more
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1550573105-0586797ad761?q=80&w=200&auto=format&fit=crop",
                  }}
                  style={styles.emptyImg}
                />
                <Text style={styles.emptyTitle}>No matching stock found</Text>
                <Text style={styles.emptySub}>
                  We couldn't find matches in stores within 5km. Try expanding
                  your search area.
                </Text>
              </View>
            )}
              </>
            )}
          </Animated.View>
        </ScrollView>
      </View>

      {/* Dynamic Action Button */}
      {result && (
        <Animated.View
          style={[
            styles.bottomAction,
            { opacity: fadeAnim, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <TouchableOpacity
            style={styles.mainActionBtn}
            onPress={() => {
              if (isRevoked) {
                navigation.goBack();
              } else if (stores && stores.length > 0) {
                navigation.navigate("PharmacyDetail", {
                  pharmacyId: stores[0].storeId,
                });
              } else {
                navigation.goBack();
              }
            }}
          >
            <LinearGradient
              colors={isRevoked ? ["#EF4444", "#B91C1C"] : ["#2FA561", "#0E7439"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.mainActionText}>
              {isRevoked
                ? "Go Back"
                : stores && stores.length > 0
                  ? "Order from Best Match"
                  : "Done"}
            </Text>
            <AppIcon name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  processingContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loadingHeader: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backFab: {
    padding: 8,
  },
  imagePreviewWrapper: {
    width: width * 0.8,
    height: height * 0.45,
    alignSelf: "center",
    marginTop: 20,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 2,
    borderColor: "#1E293B",
  },
  processingImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#2FA561",
    zIndex: 5,
  },
  lineGlow: {
    height: 60,
    width: "100%",
    position: "absolute",
    top: -30,
  },
  overlayText: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    alignItems: "center",
  },
  scanningLabel: {
    color: "#2FA561",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: 12,
  },
  loadingFooter: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  progressBarBg: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2FA561",
    borderRadius: 3,
  },
  statusText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
  },
  subStatusText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
  },
  closeBtn: {
    padding: 5,
  },
  headerMid: {
    flex: 1,
    alignItems: "center",
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  headerId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    maxWidth: 200,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 160,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 8,
    shadowColor: "#2FA561",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  heroFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  reviewNotice: {
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
  },
  reviewNoticeError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  reviewNoticeWarn: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  reviewNoticeText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  trustText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  timestamp: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  stickyBarWrapper: {
    marginBottom: 24,
    backgroundColor: "#F8FAFC", // Match master bg
  },
  stickyBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  stickyItem: {
    flex: 1,
    alignItems: "center",
  },
  stickyLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  stickyVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  titleWithCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  countPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  glassCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  dataTexts: {
    flex: 1,
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  dataVal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 12,
  },
  insightScore: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2FA561",
    marginRight: 8,
  },
  insightScoreLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  insightExplanation: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
    marginBottom: 16,
  },
  validityExplanationBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  validityExplanationText: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    fontWeight: "500",
  },
  storeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  storeMain: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  storeNameBox: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  storeDist: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  medTagCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  medTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  medDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2FA561",
  },
  medTagName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  moreMeds: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    marginLeft: 4,
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  mainActionBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#2FA561",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    zIndex: 1,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  emptyImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  errorFullContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  errorFullTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginTop: 24,
  },
  errorFullMsg: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    marginBottom: 40,
  },
  errorBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  retryBtn: {
    backgroundColor: "#2FA561",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  backErrorBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  backErrorText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 15,
  },
});
