import { apiClient } from './client';

export const getMyAppointmentRequests = async (params?: {
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    page?: number;
    limit?: number;
}) => {
    const res = await apiClient.get('/api/user/appointment-requests', { params });
    return res.data;
};

export const getMyAppointmentRequestDetail = async (requestId: string) => {
    const res = await apiClient.get(`/api/user/appointment-requests/${requestId}`);
    return res.data;
};

export const cancelAppointmentRequest = async (requestId: string, reason?: string) => {
    const res = await apiClient.put(`/api/user/appointment-requests/${requestId}/cancel`, { reason });
    return res.data;
};

// Patient's choice after a doctor no-show (see PatientConsultationDetailScreen
// note: this is the patient-facing consultation detail screen, not the
// doctor's) - either take a refund now or propose a new time.
export const requestNoShowRefund = async (requestId: string) => {
    const res = await apiClient.post(`/api/user/appointment-requests/${requestId}/no-show-refund`);
    return res.data;
};

export const requestReschedule = async (requestId: string, data: { preferredDate: string; preferredTime: string }) => {
    const res = await apiClient.post(`/api/user/appointment-requests/${requestId}/reschedule-request`, data);
    return res.data;
};

// Doctor's side of the reschedule flow - accept locks in the patient's
// proposed time, decline falls back to an automatic refund.
export const respondToReschedule = async (requestId: string, data: { accept: boolean; remarks?: string }) => {
    const res = await apiClient.post(`/api/doctor/appointment-requests/${requestId}/reschedule-respond`, data);
    return res.data;
};

export const requestAppointment = async (data: {
    doctorId: string;
    preferredDate: string;
    preferredTime: string;
    reason: string;
    consultationType?: 'chat' | 'voice' | 'video';
    urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent';
    patientDetails?: {
        name?: string;
        age?: number;
        gender?: string;
        phone?: string;
        email?: string;
        symptoms?: string;
        medicalHistory?: string;
        currentMedications?: string;
    };
}) => {
    const res = await apiClient.post('/api/user/request-appointment', data);
    return res.data;
};

export const createAppointmentPayment = async (requestId: string) => {
    const res = await apiClient.post(`/api/user/appointment-requests/${requestId}/create-payment`);
    return res.data.data as { orderId: string; amount: number; currency: string; keyId: string } | { free: true };
};

export const verifyAppointmentPayment = async (
    requestId: string,
    data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
) => {
    const res = await apiClient.post(`/api/user/appointment-requests/${requestId}/verify-payment`, data);
    return res.data;
};

export const getCallToken = async (requestId: string) => {
    const res = await apiClient.get(`/api/user/appointment-requests/${requestId}/call-token`);
    return res.data.data as { appId: string; channelName: string; token: string; uid: number };
};

export const getDoctorById = async (id: string) => {
    const res = await apiClient.get(`/api/user/doctor-details/${id}`);
    return res.data;
};

export const getPublicDoctorProfile = async (id: string) => {
    const res = await apiClient.get(`/api/user/public-doctor-profile/${id}`);
    return res.data;
};

export const submitDoctorFeedback = async (data: {
    doctorId: string,
    consultationId: string,
    rating: number,
    review: string
}) => {
    // Not /api/doctor/feedback - that route doesn't exist anywhere in the
    // backend. This is the actual working endpoint (customerController.js's
    // saveDoctorReview, mounted under /api/user).
    const res = await apiClient.post('/api/user/save-doctor-review', data);
    return res.data;
};

// A patient's existing review for a doctor, if any - lets the write screen
// pre-fill and update in place instead of creating a duplicate. The backend
// returns an empty/undefined body when there's no existing review, so the
// caller should treat anything without a numeric rating as "none yet."
export const getMyDoctorReview = async (doctorId: string): Promise<{ rating: number; review: string } | null> => {
    const res = await apiClient.get(`/api/user/get-doctor-review/${doctorId}`);
    return res.data?.rating ? res.data : null;
};

export const respondToAppointmentRequest = async (data: {
    requestId: string;
    status: 'approved' | 'rejected';
    remarks?: string;
}) => {
    const res = await apiClient.post(`/api/doctor/appointment-requests/${data.requestId}/respond`, {
        status: data.status,
        remarks: data.remarks,
    });
    return res.data;
};

export const getDoctorAppointmentRequests = async (params?: {
    status?: 'all' | 'requests' | 'upcoming' | 'history' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    page?: number;
    limit?: number;
}) => {
    const res = await apiClient.get('/api/doctor/appointment-requests', { params });
    return res.data;
};

export const getDoctorAppointmentRequestDetail = async (requestId: string) => {
    const res = await apiClient.get(`/api/doctor/appointment-requests/${requestId}`);
    return res.data;
};

export type PrescribedMedicineInput = {
    medicineSku: number;
    medicineName: string;
    intakeDetails: {
        dosage: string;
        period: string;
        instructions?: string[];
        extra?: string;
    };
};

export type PrescribedLabTestInput = {
    testName: string;
    additionalDetails?: string;
};

export type ConsultationDetailsInput = {
    notes?: string;
    prescribedMedicines?: PrescribedMedicineInput[];
    prescribedLabTests?: PrescribedLabTestInput[];
};

export type ConsultationDetails = {
    notes: string | null;
    prescribedMedicines: PrescribedMedicineInput[];
    prescribedLabTests: PrescribedLabTestInput[];
};

export const completeAppointmentRequest = async (requestId: string, details?: ConsultationDetailsInput) => {
    const res = await apiClient.post(`/api/doctor/appointment-requests/${requestId}/complete`, details || {});
    return res.data;
};

export const getPatientConsultationHistory = async (customerId: string, excludeRequestId?: string) => {
    const res = await apiClient.get(`/api/doctor/patients/${customerId}/history`, {
        params: excludeRequestId ? { excludeRequestId } : undefined,
    });
    return res.data;
};

// Patient's own past consultations with one specific doctor - never other
// doctors' history with them. Mirrors getPatientConsultationHistory above,
// just authenticated as the patient instead of the doctor.
export type PastConsultationSummary = {
    requestId: string;
    preferredDate?: string;
    preferredTime?: string;
    reason?: string;
    consultationType?: 'chat' | 'voice' | 'video';
    consultationFee?: number;
};

export const getMyConsultationHistoryWithDoctor = async (doctorId: string, excludeRequestId?: string) => {
    const res = await apiClient.get(`/api/user/doctors/${doctorId}/consultation-history`, {
        params: excludeRequestId ? { excludeRequestId } : undefined,
    });
    return res.data.data as { requests: PastConsultationSummary[] };
};

// In-call "Reports" tool - a doctor viewing a patient's previously uploaded
// documents. Backend gates this to patients with an approved/completed
// appointment with the requesting doctor, so viewUrl is safe to hit directly.
export type PatientDocumentSummary = {
    _id: string;
    name: string;
    documentType: 'lab_report' | 'scan' | 'xray' | 'diagnostic_report' | 'prescription' | 'other';
    sourceName?: string;
    fileType: 'image' | 'pdf' | 'document';
    mimeType: string;
    createdAt: string;
    viewUrl: string;
};

export const getPatientDocumentsForDoctor = async (customerId: string) => {
    const res = await apiClient.get(`/api/doctor/patients/${customerId}/documents`);
    return res.data.data as { documents: PatientDocumentSummary[] };
};

// --- New Call & Consultation APIs ---

export const storePatientChannel = async (patientId: string, doctorId: string, channelName: string, slotId: string) => {
    const res = await apiClient.post('/api/doctor/store-channel', { patientId, doctorId, channelName, slotId });
    return res.data;
};

export const fetchPatientReports = async (customerId: string) => {
    const res = await apiClient.get(`/api/doctor/patient-reports/${customerId}`);
    return res.data;
};

export const fetchMedicines = async (query: string) => {
    const res = await apiClient.get('/api/common/medicines', { params: { q: query } });
    return res.data.data as Array<{ sku: number; productName: string; brand: string }>;
};

export const fetchLabTests = async (query: string) => {
    const res = await apiClient.get('/api/common/lab-tests', { params: { q: query } });
    return res.data.data as Array<{ testName: string }>;
};

export const saveConsultationDetails = async (data: any) => {
    const res = await apiClient.post('/api/doctor/save-consultation', data);
    return res.data;
};

// --- Doctor Earnings & Payouts ---

export type DoctorPayoutMethod = {
    id: string;
    account_type: 'bank_account' | 'vpa';
    isDefault: boolean;
    createdAt: string;
    vpa?: { username: string; handle: string; address: string };
    bank_account?: { name: string; ifsc: string; account_number: string };
};

export type DoctorEarningsTransaction = {
    id: string;
    type: 'credit' | 'debit';
    source: 'appointment_request' | 'slot_booking' | 'payout';
    label: string;
    sub?: string;
    amount: number;
    status: string;
    date: string;
};

export type DoctorEarningsSummary = {
    totalEarnings: number;
    holdAmount: number;
    netEarnings: number;
    amountWithdrawn: number;
    amountAvailableToWithdraw: number;
    platformCommissionRate: number;
    totalPlatformCommission: number;
    payoutHistory: Array<{ payoutId: string; amount: number; mode: string; status: string; createdAt: string }>;
    transactions: DoctorEarningsTransaction[];
};

export const getDoctorEarnings = async () => {
    const res = await apiClient.get('/api/user/get-earnings-and-payout-history');
    return res.data as DoctorEarningsSummary;
};

export const getDoctorPayoutMethods = async () => {
    const res = await apiClient.get('/api/user/get-doctor-payout-methods');
    return res.data as { payoutMethods: DoctorPayoutMethod[] };
};

export const setDefaultFundAccount = async (accountId: string) => {
    const res = await apiClient.put(`/api/user/set-default-fund-account/${accountId}`);
    return res.data;
};

export const addBankAccount = async (data: { accountHolderName: string; accountNumber: string; bankName: string; ifsc: string }) => {
    const res = await apiClient.post('/api/doctor-payout/create-fund-account', { type: 'bank_account', ...data });
    return res.data;
};

export const addUpiAccount = async (upiId: string) => {
    const res = await apiClient.post('/api/doctor-payout/create-fund-account', { type: 'vpa', id: upiId });
    return res.data;
};

export const requestDoctorPayout = async (amount: number, fundAccountId: string) => {
    const res = await apiClient.post('/api/doctor-payout/create-payout-order', { amount, fundAccountId });
    return res.data;
};

// --- Doctor's own reviews (DoctorReviewsScreen.tsx) ---

export type DoctorReviewItem = {
    id: string;
    patientName: string;
    rating: number;
    date: string;
    comment: string;
};

export type DoctorRatingBreakdown = {
    stars: number;
    count: number;
    percentage: number;
};

export const getMyDoctorReviews = async () => {
    const res = await apiClient.get('/api/user/my-doctor-reviews');
    return res.data.data as {
        reviews: DoctorReviewItem[];
        ratingBreakdown: DoctorRatingBreakdown[];
        averageRating: number;
        totalReviews: number;
    };
};
