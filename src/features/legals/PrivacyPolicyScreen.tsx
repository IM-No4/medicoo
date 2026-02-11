import React from 'react';
import LegalPage, { LegalSection } from './LegalPage';

const LAST_UPDATED = '2026-01-29';

const SECTIONS: LegalSection[] = [
    {
        heading: '1. Introduction',
        body:
            'Medicoo (“we”, “our”, “us”) is committed to protecting your privacy. ' +
            'This Privacy Policy explains how we collect, use, store, share, and protect ' +
            'your personal and health-related information when you use the Medicoo application ' +
            'and related services (the “Platform”).'
    },
    {
        heading: '2. Information We Collect',
        body:
            'We collect information you provide directly, including but not limited to:\n\n' +
            '• Personal details such as name, phone number, email, date of birth, gender, and profile image\n' +
            '• Health information such as medical history, medications, vitals, and uploaded documents\n' +
            '• Family member details added by you with appropriate consent\n' +
            '• Doctor application details, if you apply as a healthcare professional\n' +
            '• Device information such as device ID, operating system, and app version\n\n' +
            'We may also collect limited technical data automatically for security and performance purposes.'
    },
    {
        heading: '3. Sensitive Personal Data',
        body:
            'Certain information collected on Medicoo, including medical records and health data, ' +
            'is considered Sensitive Personal Data or Information (SPDI) under Indian law.\n\n' +
            'We collect and process such data only with your explicit consent and solely for the purposes ' +
            'described in this Policy.'
    },
    {
        heading: '4. How We Use Your Information',
        body:
            'We use your information to:\n\n' +
            '• Provide and operate the Medicoo Platform\n' +
            '• Facilitate doctor consultations, appointment bookings, and medicine reminders\n' +
            '• Enable family health management features\n' +
            '• Store and display health records at your request\n' +
            '• Verify doctor credentials and comply with regulatory requirements\n' +
            '• Communicate important updates, alerts, and service-related notifications\n' +
            '• Improve platform functionality, safety, and user experience'
    },
    {
        heading: '5. Sharing of Information',
        body:
            'We share your information only when necessary and with appropriate safeguards:\n\n' +
            '• With healthcare professionals you choose to consult\n' +
            '• With pharmacies or diagnostic partners to fulfill your requests\n' +
            '• With family members you explicitly add or link\n' +
            '• With service providers such as payment gateways and cloud infrastructure providers\n' +
            '• When required by law, court order, or regulatory authority\n\n' +
            'We do NOT sell your personal or health data.'
    },
    {
        heading: '6. Family Members and Linked Accounts',
        body:
            'When you add family members, you confirm that you have obtained their consent ' +
            'to store and manage their health information.\n\n' +
            'Linking two registered users via Medicoo ID requires explicit acceptance by both parties. ' +
            'Access permissions can be modified or revoked at any time.'
    },
    {
        heading: '7. Data Storage and Retention',
        body:
            'Your information is stored on secure servers located in India or other jurisdictions ' +
            'with adequate data protection standards.\n\n' +
            'We retain personal and health data only as long as necessary to provide services, ' +
            'comply with legal obligations, or resolve disputes.\n\n' +
            'Certain records may be retained even after account deletion where required by law.'
    },
    {
        heading: '8. Data Security',
        body:
            'We implement reasonable technical and organizational measures including encryption, ' +
            'access controls, and audit logging to protect your data.\n\n' +
            'However, no system is completely secure. You acknowledge that you share information ' +
            'at your own risk.'
    },
    {
        heading: '9. Your Rights',
        body:
            'Subject to applicable law, you have the right to:\n\n' +
            '• Access and review your personal data\n' +
            '• Correct inaccurate or incomplete information\n' +
            '• Withdraw consent for specific data processing\n' +
            '• Request deletion of your account\n\n' +
            'Some rights may be limited where data retention is required by law.'
    },
    {
        heading: '10. Children’s Privacy',
        body:
            'Medicoo does not allow independent accounts for children under 18.\n\n' +
            'Health data of minors may be managed only by parents or legal guardians through family features.'
    },
    {
        heading: '11. Third-Party Services',
        body:
            'The Platform may integrate third-party services such as payment gateways or device integrations.\n\n' +
            'Medicoo is not responsible for the privacy practices of third parties. ' +
            'We recommend reviewing their respective privacy policies.'
    },
    {
        heading: '12. Changes to This Policy',
        body:
            'We may update this Privacy Policy from time to time.\n\n' +
            'Significant changes will be communicated through the Platform. ' +
            'Continued use of Medicoo constitutes acceptance of the updated policy.'
    },
    {
        heading: '13. Contact Us',
        body:
            'If you have any questions, concerns, or requests regarding this Privacy Policy or your data, ' +
            'you may contact us at:\n\n' +
            'Email: support@medicoo.in'
    }
];

export default function PrivacyPolicyScreen() {
    return <LegalPage title="Privacy Policy" lastUpdated={LAST_UPDATED} sections={SECTIONS} />;
}
