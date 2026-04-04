import { Platform } from "react-native";
import { apiClient } from "./client";

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

  const response = await apiClient.post(
    "/api/user/prescription/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  console.log("Upload Prescription Response", response.data);
  return response.data;
};
