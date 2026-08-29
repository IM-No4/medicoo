import React, { useEffect, useState } from 'react';

import { getLegalDocument } from '../../services/api/legal.api';
import LegalPage, { LegalSection } from './LegalPage';

const DOCUMENT_TYPE = 'community-guidelines';
const FALLBACK_TITLE = 'Community Guidelines';

// The backend doesn't have a 'community-guidelines' legal document type yet
// (the /api/v1/legal/:type route 400s on it) - FALLBACK_SECTIONS below
// covers that gap with real content until it's added there and becomes
// properly admin-editable, matching Privacy/Terms. The backend fetch is
// still tried first every time, so this screen switches over automatically
// the moment that endpoint exists - no further app change needed.
//
// This is distinct from ContentPolicyScreen's "Content Policy" (what
// content is/isn't allowed) - these guidelines are about how people are
// expected to behave toward each other on the platform.
const FALLBACK_SECTIONS: LegalSection[] = [
    {
        heading: '1. Our Community',
        body:
            'Medicoo connects patients, family members, and healthcare professionals. These guidelines describe the ' +
            'standard of conduct expected from everyone using the platform, so that consultations, chats, and ' +
            'reviews stay respectful and useful.'
    },
    {
        heading: '2. Be Respectful',
        body:
            'Treat doctors, support staff, and other users with courtesy. Harassment, hate speech, threats, or abusive ' +
            'language toward anyone on the platform - in chat, reviews, or consultations - is not tolerated.'
    },
    {
        heading: '3. Be Honest',
        body:
            'Provide accurate information about your symptoms, medical history, and identity. Misrepresenting who ' +
            'you are, impersonating another person, or providing false medical information can put your safety, or ' +
            'someone else’s, at risk.'
    },
    {
        heading: '4. Doctor-Patient Conduct',
        body:
            'Consultations should stay focused on the patient’s care. Doctors are expected to communicate ' +
            'professionally and stay within their area of expertise. Patients are expected to engage respectfully ' +
            'and use consultation time appropriately.'
    },
    {
        heading: '5. Reviews & Feedback',
        body:
            'Reviews should reflect genuine experiences. Do not post reviews that are fabricated, submitted on ' +
            'someone else’s behalf, or intended to harass a doctor or another user rather than share honest feedback.'
    },
    {
        heading: '6. Respect Privacy',
        body:
            'Do not share another person’s medical information, contact details, or consultation content without ' +
            'their consent. This applies to family member profiles as well - only add or manage a family member’s ' +
            'data if you’re authorized to do so on their behalf.'
    },
    {
        heading: '7. Prohibited Behavior',
        body:
            'The following are not allowed on Medicoo:\n\n' +
            '• Harassment, threats, or abusive conduct toward any user\n' +
            '• Spam, solicitation, or promotion unrelated to healthcare\n' +
            '• Attempting to move consultations off-platform to bypass safety and payment protections\n' +
            '• Sharing false medical information as if it were professional advice\n' +
            '• Any attempt to defraud another user or Medicoo'
    },
    {
        heading: '8. Reporting a Problem',
        body:
            'If another user, including a doctor, behaves in a way that violates these guidelines, report it through ' +
            'the relevant chat/consultation screen or by contacting support@medicoo.in. Reports are reviewed and may ' +
            'result in a warning, suspension, or removal from the platform.'
    },
    {
        heading: '9. Guideline Updates',
        body:
            'These guidelines may be updated as the community grows. Continued use of Medicoo after changes are ' +
            'made constitutes acceptance of the revised guidelines.'
    },
];

// Content is backend-managed (admin-editable) rather than hardcoded, same
// as PrivacyPolicyScreen/TermsOfServiceScreen - once the backend supports
// this document type. LegalPage renders its own unified header.
export default function CommunityGuidelinesScreen() {
    const [title, setTitle] = useState(FALLBACK_TITLE);
    const [sections, setSections] = useState<LegalSection[]>(FALLBACK_SECTIONS);
    const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);

    useEffect(() => {
        getLegalDocument(DOCUMENT_TYPE)
            .then((doc) => {
                setTitle(doc.title);
                setSections(doc.sections);
                setLastUpdated(doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : undefined);
            })
            .catch(() => {
                // Backend doesn't have this document type yet - keep showing
                // the local fallback content above instead of an error.
            });
    }, []);

    return <LegalPage title={title} lastUpdated={lastUpdated} sections={sections} />;
}
