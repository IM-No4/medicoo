import { ActionKey } from './action.types';

export const ActionRegistry: Record<ActionKey, any> = {
  OPEN_GLOBAL_SEARCH: {
    stack: 'SearchStack',
    screen: 'SearchHome',
  },

  OPEN_DOCTOR_LIST: {
    stack: 'DoctorStack',
    screen: 'DoctorList',
  },
  OPEN_DOCTOR_DETAIL: {
    stack: 'DoctorStack',
    screen: 'DoctorDetail',
  },
  OPEN_BOOKING_SUCCESS: {
    stack: 'DoctorStack',
    screen: 'BookingSuccess',
  },

  OPEN_PHARMACY_LIST: {
    stack: 'PharmacyStack',
    screen: 'PharmacyList',
  },

  OPEN_PHARMACY: {
    stack: 'PharmacyStack',
    screen: 'PharmacyDetail',
  },
  OPEN_CART: {
    stack: 'CartStack',
    screen: 'CartScreen',
  },
  OPEN_LABS: {
    stack: 'LabStack',
    screen: 'LabList',
  },
  OPEN_LAB_TESTS: {
    stack: 'LabStack',
    screen: 'LabTestList',
  },

  OPEN_HOSPITALS: {
    stack: 'HospitalStack',
    screen: 'HospitalList',
  },

  OPEN_AMBULANCE: {
    stack: 'AmbulanceStack',
    screen: 'AmbulanceHome',
  },

  OPEN_HOMECARE: {
    stack: 'HomeCareStack',
    screen: 'HomeCareHome',
  },

  OPEN_RECORDS: {
    tab: 'Records',
  },
  UPLOAD_RECORD: {
    stack: 'RecordsStack',
    screen: 'UploadRecord',
  },

  OPEN_PROFILE: {
    tab: 'Profile',
  },
  OPEN_PROFILE_DETAILS: {
    tab: 'Profile',
    screen: 'ProfileDetails',
  },
  OPEN_EDIT_PROFILE: {
    tab: 'Profile',
    screen: 'EditProfile',
  },
  OPEN_DOCTOR_ONBOARDING: {
    tab: 'Profile',
    screen: 'DoctorOnboarding',
  },
  OPEN_FAMILY_MEMBERS: {
    tab: 'Profile',
    screen: 'FamilyMembersModal',
  },
  OPEN_ADD_FAMILY_MEMBER: {
    tab: 'Profile',
    screen: 'AddFamilyMember',
  },
  OPEN_ADDRESS_BOOK: {
    tab: 'Profile',
    screen: 'AddressBookModal',
  },
  OPEN_CONSULTATIONS: {
    tab: 'Profile',
    screen: 'ConsultationModal',
  },
  OPEN_CONSULTATION_DETAIL: {
    tab: 'Profile',
    screen: 'ConsultationDetail',
  },
  OPEN_DOCTOR_FEEDBACK: {
    tab: 'Profile',
    screen: 'DoctorFeedback',
  },
  OPEN_MY_MEDICINE_ORDERS: {
    tab: 'Profile',
    screen: 'MedicineOrdersModal',
  },
  OPEN_MEDICINE_ORDER_DETAIL: {
    tab: 'Profile',
    screen: 'MedicineOrderDetail',
  },
  OPEN_MY_LAB_TESTS: {
    tab: 'Profile',
    screen: 'LabTestsModal',
  },
  OPEN_LAB_TEST_DETAIL: {
    tab: 'Profile',
    screen: 'LabTestDetail',
  },
  OPEN_REDEEM: {},
  OPEN_DOCTOR_SETTINGS: {
    tab: 'Profile',
    screen: 'DoctorSettings',
  },
  OPEN_MANAGE_AVAILABILITY: {
    tab: 'Profile',
    screen: 'ManageAvailability',
  },
  OPEN_MANAGE_APPOINTMENTS: {
    tab: 'Profile',
    screen: 'ManageAppointments',
  },
  OPEN_DOCTOR_PENDING_REQUESTS: {
    tab: 'Profile',
    screen: 'DoctorPendingRequests',
  },
  OPEN_DOCTOR_REVIEWS: {
    tab: 'Profile',
    screen: 'DoctorReviews',
  },
  OPEN_DOCTOR_EARNINGS: {
    tab: 'Profile',
    screen: 'DoctorEarnings',
  },
  OPEN_PATIENT_CONSULTATION_DETAIL: {
    tab: 'Profile',
    screen: 'PatientConsultationDetail',
  },
  OPEN_DOCTOR_CALL: {
    screen: 'DoctorCall',
  },
  OPEN_DOCTOR_CHAT: {
    screen: 'DoctorChat',
  },
  OPEN_HELP: {
    tab: 'Profile',
    screen: 'HelpModal',
  },
  OPEN_TERMS: {
    tab: 'Profile',
    screen: 'TermsModal',
  },
  OPEN_ADD_ADDRESS: {
    tab: 'Profile',
    screen: 'AddAddress',
  },
  OPEN_CALENDAR: {
    tab: 'Calendar',
  },
  OPEN_HEALTH: {
    tab: 'Health',
  },
  OPEN_NOTIFICATIONS: {
    stack: 'HomeStack',
    screen: 'Notifications',
  },
  ADD_MEDICINE_FROM_SEARCH: {},
  OPEN_ADDRESS_SELECTOR: {},
  INCREMENT_CART_ITEM: {},
  DECREMENT_CART_ITEM: {},
  OPEN_CHECKOUT: {},
  GO_BACK: {},
};
