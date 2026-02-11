import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Camera, Check } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { setOnboardingCompleted } from "../../bootstrap/boot.slice";
import StatusModal, { StatusType } from "../../components/modals/StatusModal";
import { completeOnboarding } from "../../redux/slices/authSlice";
import { submitOnboarding } from "../../services/api/onboarding.api";
import { getProfileDetails } from "../../services/api/user.api";
import { useOnboarding } from "./OnboardingContext";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
// const ITEM_HEIGHT = 50;
const WEIGHT_TICK_WIDTH = 40;

const FEET_RANGE = [4, 5, 6, 7];
const INCH_RANGE = Array.from({ length: 12 }, (_, i) => i);
const WEIGHT_RANGE = Array.from({ length: 171 }, (_, i) => 30 + i);

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const BLOOD_OPTIONS = [
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" },
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
];

/* ---------------- SELECTION LIST MODAL COMPONENT ---------------- */
function SelectionModal({ visible, title, options, selected, onClose }: any) {
  const [tempSelected, setTempSelected] = useState(selected);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={() => onClose(selected)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { height: SCREEN_HEIGHT * 0.5, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => onClose(selected)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={() => onClose(tempSelected)}>
              <Text style={styles.doneText}>OK</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.optionsList}>
            {options.map((option: any) => {
              const isSelected = tempSelected === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    isSelected && styles.optionItemSelected
                  ]}
                  onPress={() => setTempSelected(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Check size={20} color="#2FA561" strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- HEIGHT PICKER COMPONENT ---------------- */
function HeightPickerModal({ visible, initialFt, initialIn, onClose }: any) {
  const [tempFt, setTempFt] = useState(initialFt);
  const [tempIn, setTempIn] = useState(initialIn);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const ftIndex = FEET_RANGE.indexOf(tempFt);
  const inIndex = tempIn;

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={() => onClose(tempFt, tempIn)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { height: SCREEN_HEIGHT * 0.55, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => onClose(initialFt, initialIn)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select Height</Text>
            <TouchableOpacity onPress={() => onClose(tempFt, tempIn)}>
              <Text style={styles.doneText}>OK</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heightPickerContainer}>
            {/* Display current selection at top */}
            <View style={styles.heightDisplayRow}>
              <View style={styles.heightValueGroup}>
                <Text style={styles.heightDisplayValue}>{tempFt}</Text>
                <Text style={styles.heightDisplayUnit}>ft</Text>
              </View>
              <View style={styles.heightValueGroup}>
                <Text style={styles.heightDisplayValue}>{tempIn}</Text>
                <Text style={styles.heightDisplayUnit}>in</Text>
              </View>
            </View>

            {/* Feet scale */}
            <View style={styles.scaleSection}>
              <View style={styles.scaleCenterIndicator} pointerEvents="none" />
              <FlatList
                horizontal
                data={FEET_RANGE}
                keyExtractor={(i) => `ft-${i}`}
                snapToInterval={70}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={ftIndex}
                getItemLayout={(_, index) => ({
                  length: 70,
                  offset: 70 * index,
                  index,
                })}
                contentContainerStyle={styles.scalePadding}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / 70);
                  setTempFt(FEET_RANGE[idx]);
                }}
                renderItem={({ item }) => (
                  <View style={styles.scaleTickItem}>
                    <View style={[styles.scaleTick, styles.scaleTickMajor]} />
                    <Text style={styles.scaleTickLabel}>{item}</Text>
                  </View>
                )}
              />
            </View>

            {/* Inches scale - FIXED */}
            <View style={styles.scaleSection}>
              <View style={styles.scaleCenterIndicator} pointerEvents="none" />
              <FlatList
                horizontal
                data={INCH_RANGE}
                keyExtractor={(i) => `in-${i}`}
                snapToInterval={45}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={Math.min(Math.max(inIndex, 0), INCH_RANGE.length - 1)}
                getItemLayout={(_, index) => ({
                  length: 45,
                  offset: 45 * index,
                  index,
                })}
                contentContainerStyle={styles.scaleInchPadding}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / 45);
                  const clampedIdx = Math.min(Math.max(idx, 0), INCH_RANGE.length - 1);
                  setTempIn(INCH_RANGE[clampedIdx]);
                }}
                renderItem={({ item }) => (
                  <View style={styles.scaleTickItemSmall}>
                    <View style={styles.scaleTick} />
                    <Text style={styles.scaleTickLabelSmall}>{item}</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- WEIGHT PICKER COMPONENT ---------------- */
function WeightPickerModal({ visible, initialWeight, onClose }: any) {
  const [tempWeight, setTempWeight] = useState(initialWeight);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const initialIndex = WEIGHT_RANGE.indexOf(tempWeight);

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={() => onClose(tempWeight)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { height: SCREEN_HEIGHT * 0.45, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => onClose(initialWeight)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerTitle}>Select Weight</Text>
            <TouchableOpacity onPress={() => onClose(tempWeight)}>
              <Text style={styles.doneText}>OK</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weightPickerContainer}>
            <Text style={styles.weightDisplay}>{tempWeight}</Text>

            <View style={styles.weightScaleContainer}>
              <View style={styles.centerIndicator} pointerEvents="none" />

              <FlatList
                horizontal
                data={WEIGHT_RANGE}
                keyExtractor={(i) => i.toString()}
                snapToInterval={WEIGHT_TICK_WIDTH}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={initialIndex >= 0 ? initialIndex : 40}
                getItemLayout={(_, index) => ({
                  length: WEIGHT_TICK_WIDTH,
                  offset: WEIGHT_TICK_WIDTH * index,
                  index,
                })}
                contentContainerStyle={styles.weightPadding}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / WEIGHT_TICK_WIDTH);
                  setTempWeight(WEIGHT_RANGE[idx]);
                }}
                renderItem={({ item, index }) => {
                  const isMajor = item % 10 === 0;
                  return (
                    <View style={styles.weightTickContainer}>
                      <View style={[styles.weightTick, isMajor && styles.weightTickMajor]} />
                      {isMajor && (
                        <Text style={styles.weightTickLabel}>{item}</Text>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function HealthProfileScreen() {
  const { update, data } = useOnboarding();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [name, setName] = useState(data.name ?? "");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">((data.gender as any) ?? "");
  const [dob, setDob] = useState(data.dob ?? "");
  const [age, setAge] = useState("");
  const [blood, setBlood] = useState(data.blood ?? "");

  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(6);
  const [weight, setWeight] = useState<number>(70);

  const [sheet, setSheet] = useState<null | "camera">(null);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showBloodPicker, setShowBloodPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  // Status Modal State
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'idle',
    title: '',
    message: ''
  });

  const showStatus = (type: StatusType, title: string, message: string) => {
    setStatus({ visible: true, type, title, message });
  };

  const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;

  // Check for existing profile on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        setLoading(true);
        const profile = await getProfileDetails();

        // If mandatory fields exist, skip onboarding
        if (profile && profile.name && profile.gender && profile.dob) {
          await AsyncStorage.setItem('onboarding_completed', 'true');
          dispatch(completeOnboarding());
          dispatch(setOnboardingCompleted());
          return;
        }

        // If partial data exists, pre-fill form
        if (profile) {
          if (profile.name) setName(profile.name);
          if (profile.gender) setGender(profile.gender);
          if (profile.dob) setDob(profile.dob);
          if (profile.bloodGroup) setBlood(profile.bloodGroup); // check api key usually blood_group or bloodGroup or blood
          if (profile.blood) setBlood(profile.blood);

          if (profile.height) {
            const h = parseInt(profile.height);
            if (!isNaN(h)) {
              const totalInches = h / 2.54;
              const ft = Math.floor(totalInches / 12);
              const inch = Math.round(totalInches % 12);
              setHeightFt(ft);
              setHeightIn(inch);
            }
          }

          if (profile.weight) {
            const w = parseInt(profile.weight);
            if (!isNaN(w)) setWeight(w);
          }

          if (profile.profileImage) setAvatarUri(profile.profileImage);
        }
      } catch (error) {
        // Failed to check profile
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, []);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 160, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [gender, avatarUri]);

  const defaultAvatar = gender === "female"
    ? require("../../assets/images/woman.png")
    : require("../../assets/images/man.png");

  useEffect(() => {
    if (!dob) return;
    const d = new Date(dob);
    const diff = Date.now() - d.getTime();
    setAge(String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))));
  }, [dob]);

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showStatus('warning', 'Permission Denied', 'Camera access is required to take a profile photo.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setAvatarUri(res.assets[0].uri);
    setSheet(null);
  };

  const openGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showStatus('warning', 'Permission Denied', 'Gallery access is required to select a profile photo.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!res.canceled) setAvatarUri(res.assets[0].uri);
    setSheet(null);
  };

  const submit = async () => {
    // Validate required fields
    if (!name || !gender || !dob) {
      showStatus('warning', 'Missing Details', 'Please fill in all mandatory fields (Name, Gender, and Birth Date) to create your profile.');
      return;
    }

    const height = Math.round(heightFt * 30.48 + heightIn * 2.54);

    // Update context with all profile data
    update({
      name,
      gender,
      dob,
      age,
      height: String(height),
      weight: String(weight),
      blood,
      avatar: avatarUri ?? undefined,
    });

    // Prepare payload for API
    const payload = {
      name,
      gender,
      dob,
      age,
      height: String(height),
      weight: String(weight),
      blood,
      avatar: avatarUri ?? undefined,
    };

    setLoading(true);
    try {
      const res = await submitOnboarding(payload);

      if (!res?.success) {
        throw new Error(res?.message || 'Profile creation failed');
      }

      await AsyncStorage.setItem('onboarding_completed', 'true');
      dispatch(completeOnboarding());
      dispatch(setOnboardingCompleted());
    } catch (err: any) {
      showStatus('error', 'Profile Error', err?.message || 'We couldn\'t create your health profile. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGenderLabel = () => {
    const option = GENDER_OPTIONS.find(o => o.value === gender);
    return option ? option.label : "Select";
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#E4F2EE" }}>
      <View style={styles.header}>
        <LinearGradient
          colors={['#2FA561', '#0E7439']}
          start={Platform.select({
            ios: { x: 0, y: 0 },
            android: { x: 0.2, y: 0 },
          })}
          end={Platform.select({
            ios: { x: 1, y: 0.9 },
            android: { x: 0.8, y: 1 },
          })}
          style={StyleSheet.absoluteFill}
        />

        <Image
          source={require("../../assets/images/noise.png")}
          resizeMode="repeat"
          blurRadius={1}
          style={[StyleSheet.absoluteFill, { opacity: 0.04 }]}
        />

        <Text style={styles.headerTitle}>Create a Health Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Animated.Image
              source={avatarUri ? { uri: avatarUri } : defaultAvatar}
              style={{
                width: 92,
                height: 92,
                borderRadius: 46,
                opacity: fade
              }}
              resizeMode="cover"
            />
          </View>
          <TouchableOpacity style={styles.camera} onPress={() => setSheet("camera")}>
            <Camera size={18} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Relative</Text>
            <View style={styles.disabledBox}>
              <Text>Me</Text>
            </View>
          </View>

          <View style={{ width: 12 }} />

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity style={styles.selectBox} onPress={() => setShowGenderPicker(true)}>
              <Text>{getGenderLabel()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Date of birth</Text>
        <TouchableOpacity style={styles.dobBox} onPress={() => setShowDobPicker(true)}>
          <Calendar size={18} color="#6B7280" />
          <Text style={{ flex: 1 }}>{dob || "Select"}</Text>
          {dob && <Text style={styles.ageInline}>{age} yrs</Text>}
        </TouchableOpacity>

        {showDobPicker && (
          <DateTimePicker
            mode="date"
            maximumDate={new Date()}
            value={dob ? new Date(dob) : new Date("1995-01-01")}
            onChange={(_, d) => {
              setShowDobPicker(false);
              if (d) setDob(d.toISOString().split("T")[0]);
            }}
          />
        )}

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.selectBox, { flex: 1 }]}
            onPress={() => setShowHeightPicker(true)}
          >
            <Text>{`${heightFt} ft ${heightIn} in`}</Text>
          </TouchableOpacity>

          <View style={{ width: 12 }} />

          <TouchableOpacity
            style={[styles.selectBox, { flex: 1 }]}
            onPress={() => setShowWeightPicker(true)}
          >
            <Text>{weight} kg</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Blood group</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => setShowBloodPicker(true)}>
          <Text>{blood || "Select"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submit, loading && styles.submitDisabled]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "600" }}>Create profile</Text>
          )}
        </TouchableOpacity>
      </View>

      <HeightPickerModal
        visible={showHeightPicker}
        initialFt={heightFt}
        initialIn={heightIn}
        onClose={(ft: number, inch: number) => {
          setHeightFt(ft);
          setHeightIn(inch);
          setShowHeightPicker(false);
        }}
      />

      <WeightPickerModal
        visible={showWeightPicker}
        initialWeight={weight}
        onClose={(w: number) => {
          setWeight(w);
          setShowWeightPicker(false);
        }}
      />

      <SelectionModal
        visible={showGenderPicker}
        title="Select Gender"
        options={GENDER_OPTIONS}
        selected={gender}
        onClose={(value: string) => {
          if (value) setGender(value as any);
          setShowGenderPicker(false);
        }}
      />

      <SelectionModal
        visible={showBloodPicker}
        title="Select Blood Group"
        options={BLOOD_OPTIONS}
        selected={blood}
        onClose={(value: string) => {
          if (value) setBlood(value);
          setShowBloodPicker(false);
        }}
      />

      {sheet === "camera" && (
        <Modal transparent animationType="slide" visible>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => setSheet(null)}>
              <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <View style={[styles.sheet, { height: SCREEN_HEIGHT * 0.3, paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>Profile photo</Text>
              <TouchableOpacity style={styles.sheetItem} onPress={openCamera}>
                <Text style={styles.sheetItemText}>Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetItem} onPress={openGallery}>
                <Text style={styles.sheetItemText}>Choose from gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Status Modal */}
      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 165,
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    paddingTop: 48,
    alignItems: "center",
    overflow: "hidden",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    zIndex: 1,
  },
  card: {
    marginHorizontal: 18,
    marginTop: -58,
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    elevation: 8,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 14,
    position: "relative",
    width: 102,
    height: 102,
    alignSelf: "center",
  },
  avatar: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    overflow: "hidden",
  },
  camera: {
    position: "absolute",
    right: 0,
    bottom: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    borderWidth: 2,
    borderColor: "#fff",
  },
  label: { marginTop: 10, marginBottom: 6, color: "#4A4A4A" },
  input: {
    borderWidth: 1,
    borderColor: "#D9E3E1",
    borderRadius: 12,
    padding: 12,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#D9E3E1",
    borderRadius: 12,
    padding: 12,
  },
  disabledBox: {
    borderWidth: 1,
    borderColor: "#D9E3E1",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F5FAF8",
  },
  row: { flexDirection: "row", marginTop: 10 },
  dobBox: {
    borderWidth: 1,
    borderColor: "#D9E3E1",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ageInline: { color: "#0E7439", fontWeight: "600" },
  submit: {
    marginTop: 22,
    backgroundColor: "#0E7439",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  modalContainer: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginVertical: 8,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  sheetItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  sheetItemText: {
    fontSize: 16,
    color: "#111827",
  },

  /* PICKER HEADER */
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  cancelText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  doneText: {
    fontSize: 15,
    color: "#2FA561",
    fontWeight: "700",
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  optionItemSelected: {
    backgroundColor: "#F0FDF4",
  },
  optionText: {
    fontSize: 16,
    color: "#4B5563",
  },
  optionTextSelected: {
    color: "#2FA561",
    fontWeight: "600",
  },

  /* HEIGHT PICKER SPECIFIC */
  heightPickerContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  heightDisplayRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "baseline",
    gap: 20,
    paddingVertical: 15,
  },
  heightValueGroup: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  heightDisplayValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#111827",
  },
  heightDisplayUnit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  scaleSection: {
    height: 100,
    justifyContent: "center",
    position: "relative",
  },
  scaleCenterIndicator: {
    position: "absolute",
    left: SCREEN_WIDTH / 2 - 1,
    top: 10,
    bottom: 10,
    width: 2,
    backgroundColor: "#2FA561",
    zIndex: 10,
    borderRadius: 1,
  },
  scalePadding: {
    paddingHorizontal: SCREEN_WIDTH / 2 - 35,
  },
  scaleTickItem: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleTick: {
    width: 2,
    height: 30,
    backgroundColor: "#D1D5DB",
    borderRadius: 1,
  },
  scaleTickMajor: {
    height: 45,
    width: 3,
    backgroundColor: "#9CA3AF",
  },
  scaleTickLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  scaleInchPadding: {
    paddingHorizontal: SCREEN_WIDTH / 2 - 22.5,
  },
  scaleTickItemSmall: {
    width: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleTickLabelSmall: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  /* WEIGHT PICKER SPECIFIC */
  weightPickerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  weightDisplay: {
    fontSize: 52,
    fontWeight: "900",
    color: "#2FA561",
    marginBottom: 30,
  },
  weightScaleContainer: {
    height: 100,
    width: "100%",
    position: "relative",
  },
  centerIndicator: {
    position: "absolute",
    left: SCREEN_WIDTH / 2 - 2,
    top: -10,
    width: 4,
    height: 60,
    backgroundColor: "#2FA561",
    zIndex: 10,
    borderRadius: 2,
  },
  weightPadding: {
    paddingHorizontal: SCREEN_WIDTH / 2 - WEIGHT_TICK_WIDTH / 2,
  },
  weightTickContainer: {
    width: WEIGHT_TICK_WIDTH,
    alignItems: "center",
  },
  weightTick: {
    width: 2,
    height: 25,
    backgroundColor: "#D1D5DB",
    borderRadius: 1,
  },
  weightTickMajor: {
    height: 40,
    backgroundColor: "#9CA3AF",
    width: 2,
  },
  weightTickLabel: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  }
});