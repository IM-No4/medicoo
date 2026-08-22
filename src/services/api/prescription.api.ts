import { Platform } from "react-native";
import { apiClient } from "./client";

export interface DoctorPrescribedMedicine {
  _id: string;
  patientId: string;
  doctorId: string;
  doctorName?: string;
  specialization?: string;
  profileImage?: string;
  createdAt: string;
  prescribedMedicines: {
    medicineSku?: string;
    medicineName: string;
    intakeDetails?: {
      dosage?: string;
      period?: string;
      instructions?: string;
      extra?: string;
    };
  }[];
}

// GET /api/user/get-medicine-prescription - the logged-in patient's
// doctor-issued prescriptions from the last 3 months. The backend returns a
// bare 404 with {message: 'No prescriptions found'} when there are none
// (not an error condition for this screen) and a plain array (no
// {success, data} envelope) otherwise - both handled here so callers just
// get a list, empty or not.
export const getMedicinePrescriptions = async (): Promise<DoctorPrescribedMedicine[]> => {
  try {
    const response = await apiClient.get<DoctorPrescribedMedicine[]>(
      "/api/user/get-medicine-prescription",
    );
    return response.data ?? [];
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const uploadPrescription = async ({
  prescriptionImage,
  storeId,
  latitude,
  longitude,
}: {
  prescriptionImage: any;
  storeId?: string;
  latitude: number;
  longitude: number;
}) => {
  const formData = new FormData();

  // Handle the image file structure for FormData
  const uri = prescriptionImage.uri;
  const name = uri.split("/").pop() || "prescription.jpg";
  const match = /\.(\w+)$/.exec(name);
  const type = match ? `image/${match[1]}` : `image`;

  formData.append("prescriptionImage", {
    uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
    name,
    type,
  } as any);

  if (storeId) {
    formData.append("storeId", storeId);
  }
  formData.append("latitude", String(latitude));
  formData.append("longitude", String(longitude));

  // See document.api.ts's uploadDocument for why this Content-Type must be
  // set explicitly (confirmed via a live device trace).
  const response = await apiClient.post(
    "/api/user/prescription/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  console.log("Upload Prescription Response", response.data);
  return response.data;
};
