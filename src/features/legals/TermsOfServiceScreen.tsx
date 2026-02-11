import React from 'react';
import LegalPage, { LegalSection } from './LegalPage';

const LAST_UPDATED = '2026-01-29';

const SECTIONS: LegalSection[] = [
    {
        body: 'Welcome to Medicoo.\n\nThese Terms of Service (“Terms”) govern your access to and use of the Medicoo mobile application, website, and related services (collectively, the “Platform”), operated by Medicoo (“we”, “us”, “our”).\n\nBy accessing or using Medicoo, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.'
    },
    {
        heading: '1. ELIGIBILITY',
        body: 'You must be at least 18 years of age to use Medicoo. If you are using the Platform on behalf of another individual (such as a family member), you confirm that you have the legal authority or consent to do so.'
    },
    {
        heading: '2. NATURE OF THE PLATFORM',
        body: 'Medicoo is a technology platform that facilitates:\n• Appointment booking with healthcare professionals\n• Medication reminders and tracking\n• Storage of health records\n• Family health management\n• Pharmacy and diagnostic discovery\n\nMedicoo does NOT:\n• Provide medical advice\n• Diagnose medical conditions\n• Replace professional medical judgment\n• Guarantee treatment outcomes\n\nAll medical decisions must be made by licensed healthcare professionals.'
    },
    {
        heading: '3. TELEMEDICINE DISCLAIMER',
        body: 'Teleconsultations facilitated through Medicoo are governed by the Telemedicine Practice Guidelines issued by the Government of India (2020).\n\nDoctors available on the Platform are independent professionals. Medicoo does not control or influence their medical judgment, prescriptions, or advice.\n\nIn case of medical emergencies, users must contact local emergency services immediately. Medicoo is not an emergency service.'
    },
    {
        heading: '4. USER ACCOUNTS',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account.\n\nYou agree to provide accurate, current, and complete information and to update it as necessary.\n\nYou must notify Medicoo immediately of any unauthorized access or security breach.'
    },
    {
        heading: '5. FAMILY MEMBERS & CAREGIVER ACCESS',
        body: 'Medicoo allows users to add family members and manage their health records.\n\nBy adding a family member, you confirm that you have obtained appropriate consent.\n\nLinking of registered users through Medicoo IDs requires explicit acceptance by both parties.\n\nMedicoo is not responsible for disputes arising from family or caregiver access.'
    },
    {
        heading: '6. MEDICAL DATA & RECORDS',
        body: 'Health records stored on Medicoo are provided by users, healthcare professionals, or integrated services.\n\nWhile we implement reasonable security measures, Medicoo does not guarantee the accuracy, completeness, or clinical correctness of stored data.\n\nUsers are encouraged to verify critical medical information with healthcare providers.'
    },
    {
        heading: '7. DOCTOR APPLICATIONS',
        body: 'Healthcare professionals may apply to offer services through Medicoo.\n\nSubmission of an application does not guarantee approval.\n\nMedicoo reserves the right to approve, reject, suspend, or terminate doctor accounts based on verification, regulatory compliance, or internal policies.'
    },
    {
        heading: '8. PAYMENTS & FEES',
        body: 'Consultation fees, service charges, and applicable taxes are displayed before payment.\n\nPayments are processed via third-party payment gateways. Medicoo does not store card or banking details.\n\nRefunds, if applicable, are governed by the specific service provider’s policy.'
    },
    {
        heading: '9. USER CONDUCT',
        body: 'You agree NOT to:\n• Misuse the Platform\n• Impersonate others\n• Upload false medical information\n• Attempt to breach security\n• Harass healthcare providers or users\n• Use Medicoo for unlawful purposes\n\nViolation may result in suspension or termination.'
    },
    {
        heading: '10. CONTENT OWNERSHIP',
        body: 'You retain ownership of your personal data.\n\nBy using Medicoo, you grant us a limited license to store, process, and display your data solely for providing the services.'
    },
    {
        heading: '11. DATA PRIVACY',
        body: 'Your data is handled in accordance with our Privacy Policy and applicable Indian data protection laws.\n\nSensitive personal and health data is processed only with user consent.'
    },
    {
        heading: '12. ACCOUNT TERMINATION',
        body: 'You may delete your account at any time.\n\nMedicoo may suspend or terminate access if:\n• These Terms are violated\n• Required by law\n• Account activity poses risk to users or the Platform\n\nCertain data may be retained for legal or regulatory purposes.'
    },
    {
        heading: '13. LIMITATION OF LIABILITY',
        body: 'To the maximum extent permitted by law, Medicoo shall not be liable for:\n• Medical outcomes\n• Misdiagnosis or treatment decisions\n• Loss of data due to user error\n• Service interruptions\n• Third-party actions\n\nUse of the Platform is at your own risk.'
    },
    {
        heading: '14. INDEMNIFICATION',
        body: 'You agree to indemnify and hold harmless Medicoo from claims, damages, or losses arising from your misuse of the Platform or violation of these Terms.'
    },
    {
        heading: '15. MODIFICATIONS',
        body: 'Medicoo may update these Terms from time to time.\n\nContinued use of the Platform after changes constitutes acceptance.'
    },
    {
        heading: '16. GOVERNING LAW',
        body: 'These Terms are governed by the laws of India.\n\nAny disputes shall be subject to the exclusive jurisdiction of courts located in India.'
    },
    {
        heading: '17. CONTACT INFORMATION',
        body: 'For questions or concerns:\nEmail: support@medicoo.in'
    }
];


export default function TermsOfServiceScreen() {
    return <LegalPage title="Terms of Service" lastUpdated={LAST_UPDATED} sections={SECTIONS} />;
}
