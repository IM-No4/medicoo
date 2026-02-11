import React from 'react';
import LegalPage, { LegalSection } from './LegalPage';

const LAST_UPDATED = '2026-01-29';

const SECTIONS: LegalSection[] = [
    {
        heading: '1. Purpose of This Policy',
        body:
            'This Content Policy governs all content created, uploaded, shared, or transmitted through Medicoo, ' +
            'including text, images, documents, messages, medical records, and profile information (“User Content”).\n\n' +
            'The objective of this policy is to ensure a safe, respectful, and legally compliant environment for users, ' +
            'family members, healthcare professionals, and partners.'
    },
    {
        heading: '2. Responsibility for User Content',
        body:
            'You are solely responsible for all User Content you submit or share through the Platform.\n\n' +
            'This includes ensuring that:\n' +
            '• You have the legal right and consent to upload the content\n' +
            '• The content is accurate to the best of your knowledge\n' +
            '• The content does not violate any applicable laws, regulations, or third-party rights\n\n' +
            'Medicoo does not independently verify user-generated content unless required for compliance or safety.'
    },
    {
        heading: '3. Health & Medical Content Disclaimer',
        body:
            'Medical information shared by users is for record-keeping and consultation facilitation only.\n\n' +
            'Users must not rely on other users’ content as medical advice.\n\n' +
            'Only licensed healthcare professionals are authorized to provide medical guidance through the Platform.'
    },
    {
        heading: '4. Prohibited Content',
        body:
            'You agree not to upload, post, or share content that:\n\n' +
            '• Is false, misleading, or fraudulent\n' +
            '• Is illegal or violates any applicable law or regulation\n' +
            '• Is abusive, harassing, threatening, defamatory, or hateful\n' +
            '• Violates patient confidentiality or medical ethics\n' +
            '• Contains malware, viruses, or harmful code\n' +
            '• Infringes intellectual property or privacy rights\n' +
            '• Impersonates another person or entity\n' +
            '• Promotes self-harm, violence, or illegal substances\n\n' +
            'This applies to all areas of the Platform, including profiles, documents, messages, and consultations.'
    },
    {
        heading: '5. Family Member Content & Consent',
        body:
            'When uploading content related to family members, you confirm that you have obtained appropriate consent ' +
            'or legal authority to share such information.\n\n' +
            'Medicoo is not responsible for disputes arising from unauthorized or improper sharing of family members’ data.'
    },
    {
        heading: '6. Doctor & Professional Content',
        body:
            'Healthcare professionals using Medicoo must ensure that all information, credentials, and responses are accurate, ' +
            'ethical, and compliant with applicable medical guidelines and laws.\n\n' +
            'Misrepresentation of qualifications or provision of unsafe guidance may result in suspension or termination.'
    },
    {
        heading: '7. Review, Moderation, and Enforcement',
        body:
            'Medicoo reserves the right, but not the obligation, to review, monitor, and moderate User Content.\n\n' +
            'We may remove, restrict, or disable access to content that:\n' +
            '• Violates this Content Policy\n' +
            '• Poses a risk to users or the Platform\n' +
            '• Is required to be removed by law or regulatory authority\n\n' +
            'Enforcement actions may include warnings, content removal, account suspension, or termination.'
    },
    {
        heading: '8. Intellectual Property Rights',
        body:
            'You retain ownership of your User Content.\n\n' +
            'By uploading content to Medicoo, you grant us a limited, non-exclusive, royalty-free license to store, process, ' +
            'display, and transmit such content solely for the purpose of operating and improving the Platform.'
    },
    {
        heading: '9. Reporting Violations',
        body:
            'If you encounter content that violates this Policy, you may report it through the Platform or by contacting support.\n\n' +
            'Medicoo will review reported content and take appropriate action where necessary.'
    },
    {
        heading: '10. Policy Updates',
        body:
            'Medicoo may update this Content Policy periodically.\n\n' +
            'Continued use of the Platform after changes are made constitutes acceptance of the revised policy.'
    },
    {
        heading: '11. Contact Information',
        body:
            'For questions or concerns regarding this Content Policy, please contact:\n\n' +
            'Email: support@medicoo.in'
    }
];

export default function ContentPolicyScreen() {
    return <LegalPage title="Content Policy" lastUpdated={LAST_UPDATED} sections={SECTIONS} />;
}
