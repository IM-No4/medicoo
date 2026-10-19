import { apiClient } from './client';

const BASE_URL = '/api/v1/family';

export const addFamilyMember = async (memberData: any) => {
    // See document.api.ts's uploadDocument for why this Content-Type must
    // be set explicitly for the FormData case (confirmed via a live device
    // trace).
    const isFormData = memberData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.post(`${BASE_URL}/add-member`, memberData, config);
    return res.data;
};

export const getFamilyMembers = async () => {
    const res = await apiClient.get(`${BASE_URL}/members`);
    return res.data;
};

export const removeFamilyMember = async (memberId: string) => {
    const res = await apiClient.delete(`${BASE_URL}/member/${memberId}`);
    return res.data;
};

export const getIncomingRequests = async () => {
    const res = await apiClient.get(`${BASE_URL}/incoming-requests`);
    return res.data;
};

export const respondToRequest = async (requestId: string, action: 'accept' | 'reject', consent?: FamilyConsent) => {
    const res = await apiClient.post(`${BASE_URL}/respond-request`, { requestId, action, consent });
    return res.data;
};

export const leaveFamily = async (memberId?: string) => {
    const res = await apiClient.post(`${BASE_URL}/leave-family`, { memberId });
    return res.data;
};

// === Viewing a consenting linked family member's health data ===

export const getFamilyMemberMedicines = async (memberId: string) => {
    const res = await apiClient.get(`${BASE_URL}/member/${memberId}/medicines`);
    return res.data;
};

export const getFamilyMemberVitals = async (memberId: string) => {
    const res = await apiClient.get(`${BASE_URL}/member/${memberId}/vitals`);
    return res.data;
};

export const getFamilyMemberAppointments = async (memberId: string) => {
    const res = await apiClient.get(`${BASE_URL}/member/${memberId}/appointments`);
    return res.data;
};

// Every family group the current user has been linked into by someone
// else - the reverse of getFamilyMembers, which only lists groups they own.
export const getMyMemberships = async () => {
    const res = await apiClient.get(`${BASE_URL}/my-memberships`);
    return res.data;
};

// The actual consent control - only affects how much of the caller's own
// health data the household head who added them (addedBy) can see.
export const updateMySharingPermissions = async (memberId: string, changes: Partial<FamilyConsent>) => {
    const res = await apiClient.patch(`${BASE_URL}/member/${memberId}/permissions`, changes);
    return res.data;
};

/** Everything a family member can allow the family head to do. The member chooses each one; none is on until they do. */
export type FamilyConsentKey =
    | 'bookConsultations'
    | 'joinConsultations'
    | 'viewAppointments'
    | 'viewPrescriptions'
    | 'viewDocuments'
    | 'manageDocuments'
    | 'viewVitals'
    | 'viewMedications'
    | 'viewAdherence'
    | 'manageMedications'
    | 'missedDoseAlerts';

export type FamilyConsent = Record<FamilyConsentKey, boolean>;

export interface FamilyConsentItem {
    key: FamilyConsentKey;
    group: string;
    label: string;
    description: string;
}

export const getConsentItems = async (): Promise<FamilyConsentItem[]> => {
    const res = await apiClient.get(`${BASE_URL}/consent-items`);
    return res.data?.data || [];
};

// What the family head has seen or done in my records.
export const getMyAccessLog = async () => {
    const res = await apiClient.get(`${BASE_URL}/my-memberships/access-log`);
    return res.data?.data || [];
};

// === A family member's records, from the family head's account (each needs the member's agreement) ===

export const getFamilyMemberAdherence = async (memberId: string, days = 7) => {
    const res = await apiClient.get(`${BASE_URL}/member/${memberId}/adherence`, { params: { days } });
    return res.data;
};

export const getFamilyMemberDocuments = async (memberId: string) => {
    const res = await apiClient.get(`${BASE_URL}/member/${memberId}/documents`);
    return res.data;
};

export const getFamilyMemberPrescriptions = async (memberId: string) => {
    const res = await apiClient.get(`${BASE_URL}/member/${memberId}/prescriptions`);
    return res.data;
};
