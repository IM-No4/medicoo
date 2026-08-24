import { executeAction } from "@/src/actions/ActionExecutor";
import StickyCartBar from "@/src/components/cart/StickyCartBar";
import AppIcon from "@/src/components/icons/AppIcon";
import PrescriptionUploadModal from "@/src/components/modals/PrescriptionUploadModal";
import { RootState } from "@/src/redux/store";
import {
  getStoreDetails,
  getStoreMedicines,
} from "@/src/services/api/pharmacy.api";
import { getMedicinePrescriptions } from "@/src/services/api/prescription.api";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

import MedicineDetailBottomSheet from "@/src/components/modals/MedicineDetailBottomSheet";
import StatusModal, { StatusType } from "@/src/components/modals/StatusModal";
import CartItemsHorizontalScroll from "./components/CartItemsHorizontalScroll";
import FilterChips from "./components/FilterChips";
import MedicineRow from "./components/MedicineRow";
import PharmacyHeader from "./components/PharmacyHeader";

export default function PharmacyDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { pharmacyId } = route.params || {};
  const insets = useSafeAreaInsets();

  const [pharmacy, setPharmacy] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const searchModalInputRef = useRef<TextInput>(null);
  const [headerHeight, setHeaderHeight] = useState(160);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [isMedicineDetailVisible, setIsMedicineDetailVisible] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    status: StatusType;
    title?: string;
    message?: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({
    visible: false,
    status: "idle",
  });

  /* ------------------ LOCATION (SOURCE OF TRUTH) ------------------ */

  const selectedAddress = useSelector(
    (state: RootState) => state.address.selectedAddress,
  );

  const currentLocation = useSelector(
    (state: RootState) => state.location.currentLocation,
  );

  const lat = selectedAddress?.latitude ?? currentLocation?.latitude;

  const long = selectedAddress?.longitude ?? currentLocation?.longitude;

  /* ------------------ API LOAD ------------------ */

  useEffect(() => {
    let mounted = true;

    if (!pharmacyId || !lat || !long) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        console.log(
          "🔍 Loading Pharmacy Detail for ID:",
          pharmacyId,
          "at",
          lat,
          long,
        );
        setLoading(true);

        const store = await getStoreDetails({
          storeId: pharmacyId,
          lat,
          long,
        });

        const meds = await getStoreMedicines({
          storeId: pharmacyId,
        });

        const medsList = Array.isArray(meds)
          ? meds
          : meds?.data || meds?.medicines || [];

        if (!mounted) return;

        setPharmacy(store);
        setMedicines(medsList);
      } catch (e) {
        console.error("Failed to load pharmacy details", e);
      } finally {
        mounted && setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [pharmacyId, lat, long]);

  /* ------------------ LOCAL SEARCH ------------------ */

  const filteredMedicines = useMemo(() => {
    if (!query.trim()) return medicines;
    const q = query.toLowerCase();

    return medicines.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) || m.brand?.toLowerCase().includes(q),
    );
  }, [query, medicines]);

  /* ------------------ SCROLL HANDLING ------------------ */

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setIsSearchSticky(offsetY > headerHeight - 94);
  };

  /* ------------------ PRESCRIPTION UPLOAD ------------------ */

  // "Recent Prescriptions" in the modal below used to be a single
  // hardcoded fake entry with no working tap handler at all - fetched here
  // (real doctor-issued records) whenever the modal opens, and kept
  // alongside its raw source so selecting one can look up its medicines.
  const [existingPrescriptions, setExistingPrescriptions] = useState<any[]>([]);
  useEffect(() => {
    if (!isUploadModalVisible) return;
    getMedicinePrescriptions()
      .then(setExistingPrescriptions)
      .catch((e) => console.warn("Failed to load existing prescriptions", e));
  }, [isUploadModalVisible]);

  const handleSelectExistingPrescription = (prescriptionId: string) => {
    const prescription = existingPrescriptions.find((p) => p._id === prescriptionId);
    const firstMedicineName = prescription?.prescribedMedicines?.[0]?.medicineName;
    setIsUploadModalVisible(false);
    if (firstMedicineName) {
      executeAction("OPEN_GLOBAL_SEARCH", { query: firstMedicineName });
    }
  };

  const handlePrescriptionUpload = async (image: any) => {
    // Robustly extract coordinates
    const finalLat = selectedAddress?.latitude ?? currentLocation?.latitude;
    const finalLong = selectedAddress?.longitude ?? currentLocation?.longitude;

    if (
      finalLat === undefined ||
      finalLong === undefined ||
      finalLat === null ||
      finalLong === null
    ) {
      setStatusModal({
        visible: true,
        status: "error",
        title: "Location Error",
        message:
          "Location not found. Please ensure you have an address selected or location services enabled.",
      });
      return;
    }

    // Immediately navigate to Analysis screen
    setIsUploadModalVisible(false);
    navigation.navigate("PrescriptionResult", {
      image: image,
      latitude: finalLat,
      longitude: finalLong,
      storeId: pharmacyId,
    });
  };

  /* ------------------ LOADING ------------------ */

  if (loading || !pharmacy) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007C69" />
      </View>
    );
  }

  /* ------------------ RENDER ------------------ */

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Solid White Status Bar Background (prevents scroll overlap) */}
      <View style={[styles.statusBarBackground, { height: insets.top }]} />

      {/* Sticky Search Bar */}
      {isSearchSticky && (
        <View
          style={[
            styles.stickySearchContainer,
            { paddingTop: insets.top + 12 },
          ]}
        >
          <View style={styles.searchWrapper}>
            <TouchableOpacity
              style={styles.searchContainer}
              activeOpacity={0.7}
              onPress={() => setIsSearchModalVisible(true)}
            >
              <AppIcon name="search" size={20} color="#8A8A8E" />
              <Text
                style={[
                  styles.searchInput,
                  !query && styles.searchPlaceholder,
                ]}
                numberOfLines={1}
              >
                {query || "Search medicines..."}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.scanIconButton}
            onPress={() => setIsUploadModalVisible(true)}
          >
            <AppIcon name="scan-text-icon" size={24} color="#8A8A8E" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredMedicines}
        keyExtractor={(item, index) => {
          const key =
            item.inventoryId ||
            item.medicineId ||
            item.sku ||
            item._id ||
            item.id;
          return key ? `${String(key)}-${index}` : `med-${index}`;
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <AppIcon
                  name={query.trim() ? "search" : "pill"}
                  size={40}
                  color="#9CA3AF"
                />
              </View>
              <Text style={styles.emptyTitle}>
                {query.trim() ? "No Medicines Found" : "No Medicines Available"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {query.trim()
                  ? `We couldn't find any medicines matching "${query}". Try searching for something else.`
                  : "This pharmacy doesn't have any medicines listed yet."}
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <>
            <PharmacyHeader
              pharmacy={pharmacy}
              onBack={() => navigation.goBack()}
              onLayout={(e) => {
                const { height } = e.nativeEvent.layout;
                setHeaderHeight(height);
              }}
            >
              {/* SEARCH BAR */}
              <View style={styles.searchRowWrapper}>
                <View style={styles.searchWrapperInline}>
                  <TouchableOpacity
                    style={styles.searchContainer}
                    activeOpacity={0.7}
                    onPress={() => setIsSearchModalVisible(true)}
                  >
                    <AppIcon name="search" size={20} color="#8A8A8E" />
                    <Text
                      style={[
                        styles.searchInput,
                        !query && styles.searchPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {query || "Search medicines..."}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.scanIconButton}
                  onPress={() => setIsUploadModalVisible(true)}
                >
                  <AppIcon name="scan-text-icon" size={24} color="#8A8A8E" />
                </TouchableOpacity>
              </View>
            </PharmacyHeader>

            {/* FILTERS */}
            <FilterChips />
            {/* CART ITEMS HORIZONTAL SCROLL */}
            <CartItemsHorizontalScroll
              storeId={pharmacyId}
              isStoreOpen={pharmacy?.status === "online"}
              onItemPress={(item) => {
                const medicine = medicines.find(
                  (m) =>
                    String(m.sku || m.inventoryId || m.medicineId) ===
                    String(item.sku),
                );
                if (medicine) {
                  setSelectedMedicine(medicine);
                  setIsMedicineDetailVisible(true);
                }
              }}
            />
          </>
        }
        renderItem={({ item, index }) => (
          <MedicineRow
            medicine={item}
            isStoreOpen={pharmacy?.status === "online"}
            storeId={pharmacyId}
            storeName={pharmacy?.storeName || ""}
            isFirst={index === 0}
            isLast={index === filteredMedicines.length - 1}
            onPress={() => {
              setSelectedMedicine(item);
              setIsMedicineDetailVisible(true);
            }}
          />
        )}
        contentContainerStyle={{
          paddingBottom: 220,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* ------------------ FULL-SCREEN SEARCH MODAL ------------------ */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSearchModalVisible(false)}
        onShow={() => {
          // Focusing (and so raising the keyboard) only once the slide-up
          // has actually finished, instead of via autoFocus firing the
          // instant this mounts, is what stops the modal's own entrance
          // animation and the keyboard's animation from racing each other.
          setTimeout(() => searchModalInputRef.current?.focus(), 50);
        }}
      >
        <View style={[styles.searchModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.searchModalHeader}>
            <TouchableOpacity
              style={styles.searchModalBackBtn}
              onPress={() => setIsSearchModalVisible(false)}
            >
              <AppIcon name="arrow-left" size={22} color="#1C1C1E" />
            </TouchableOpacity>
            <View style={[styles.searchContainer, { flex: 1 }]}>
              <AppIcon name="search" size={20} color="#8A8A8E" />
              <TextInput
                ref={searchModalInputRef}
                placeholder="Search medicines..."
                value={query}
                onChangeText={setQuery}
                style={styles.searchInput}
                placeholderTextColor="#8A8A8E"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <AppIcon name="x" size={18} color="#8A8A8E" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={filteredMedicines}
            keyExtractor={(item, index) => {
              const key =
                item.inventoryId ||
                item.medicineId ||
                item.sku ||
                item._id ||
                item.id;
              return key ? `${String(key)}-${index}` : `search-med-${index}`;
            }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <AppIcon
                    name={query.trim() ? "search" : "pill"}
                    size={40}
                    color="#9CA3AF"
                  />
                </View>
                <Text style={styles.emptyTitle}>
                  {query.trim() ? "No Medicines Found" : "Search this pharmacy"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {query.trim()
                    ? `We couldn't find any medicines matching "${query}". Try searching for something else.`
                    : "Start typing to search medicines available at this pharmacy."}
                </Text>
              </View>
            }
            renderItem={({ item, index }) => (
              <MedicineRow
                medicine={item}
                isStoreOpen={pharmacy?.status === "online"}
                storeId={pharmacyId}
                storeName={pharmacy?.storeName || ""}
                isFirst={index === 0}
                isLast={index === filteredMedicines.length - 1}
                onPress={() => {
                  setIsSearchModalVisible(false);
                  setSelectedMedicine(item);
                  setIsMedicineDetailVisible(true);
                }}
              />
            )}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* ------------------ STICKY CART BAR ------------------ */}
      <StickyCartBar
        onPress={(storeId) =>
          executeAction("OPEN_CART", {
            storeID: storeId,
          })
        }
      />

      {/* ------------------ PRESCRIPTION UPLOAD MODAL ------------------ */}
      <PrescriptionUploadModal
        visible={isUploadModalVisible}
        isLoading={isUploading}
        onClose={() => !isUploading && setIsUploadModalVisible(false)}
        onImageSelected={handlePrescriptionUpload}
        onPrescriptionSelected={handleSelectExistingPrescription}
        existingPrescriptions={existingPrescriptions.map((p) => ({
          id: p._id,
          doctorName: p.doctorName || "Doctor",
          prescriptionDate: p.createdAt,
          items: p.prescribedMedicines?.length || 0,
        }))}
      />

      {/* ------------------ MEDICINE DETAIL BOTTOM SHEET ------------------ */}
      <MedicineDetailBottomSheet
        visible={isMedicineDetailVisible}
        medicine={selectedMedicine}
        storeId={pharmacyId}
        storeName={pharmacy?.storeName || ""}
        isStoreOpen={pharmacy?.status === "online"}
        allMedicines={medicines}
        onSelectMedicine={(m) => setSelectedMedicine(m)}
        onClose={() => {
          setIsMedicineDetailVisible(false);
          setSelectedMedicine(null);
        }}
      />

      <StatusModal
        visible={statusModal.visible}
        status={statusModal.status}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
        primaryAction={statusModal.primaryAction}
        primaryActionText={statusModal.primaryActionText}
        autoCloseDelay={
          statusModal.status === "success" && !statusModal.primaryAction
            ? 3000
            : undefined
        }
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
  },
  searchRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 0,
    backgroundColor: "transparent",
    gap: 12,
  },
  searchWrapperInline: {
    flex: 1,
  },
  searchWrapper: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#1c1c1e",
  },
  searchPlaceholder: {
    color: "#8A8A8E",
  },
  scanIconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stickySearchContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8A8A8E",
    textAlign: "center",
    lineHeight: 20,
  },
  statusBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    zIndex: 999,
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchModalBackBtn: {
    padding: 4,
  },
});
