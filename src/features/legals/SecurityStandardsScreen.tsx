import React, { useEffect, useState } from 'react';

import { getLegalDocument } from '../../services/api/legal.api';
import LegalPage, { LegalSection } from './LegalPage';

const DOCUMENT_TYPE = 'security';
const FALLBACK_TITLE = 'Security Standards';

// The backend doesn't have a 'security' legal document type yet (the
// /api/v1/legal/:type route 400s on it) - FALLBACK_SECTIONS below covers
// that gap with real content until it's added there and becomes properly
// admin-editable, matching Privacy/Terms. The backend fetch is still tried
// first every time, so this screen switches over automatically the moment
// that endpoint exists - no further app change needed.
const FALLBACK_SECTIONS: LegalSection[] = [
    {
        heading: '1. Our Approach to Security',
        body:
            'Medicoo handles health information, so security is treated as a baseline requirement, not an add-on. ' +
            'This page explains the safeguards in place to protect your account, your medical data, and your ' +
            'consultations with healthcare professionals.'
    },
    {
        heading: '2. Data Encryption',
        body:
            'All data transmitted between the app and our servers is encrypted in transit using industry-standard ' +
            'TLS/SSL. Sensitive data - including medical records, prescriptions, and identity documents - is ' +
            'encrypted at rest in our database and file storage.'
    },
    {
        heading: '3. Account Protection',
        body:
            'Access to your account is protected through OTP-based authentication tied to your registered mobile ' +
            'number. We recommend never sharing your OTP with anyone, including individuals claiming to represent ' +
            'Medicoo - our team will never ask for it.'
    },
    {
        heading: '4. Access Controls',
        body:
            'Internal access to user data is restricted on a need-to-know basis. Doctors can only view medical ' +
            'records belonging to patients who have booked a consultation with them or an explicitly linked family ' +
            'member. Administrative access to production data is logged and limited to authorized personnel.'
    },
    {
        heading: '5. Secure Infrastructure',
        body:
            'Our servers and databases run on infrastructure with firewalls, network isolation, and regular security ' +
            'patching. Backups are encrypted and stored separately from primary systems to protect against data loss.'
    },
    {
        heading: '6. Payment Security',
        body:
            'Payments are processed through PCI-DSS compliant payment gateway partners. Medicoo does not store your ' +
            'full card details on its own servers.'
    },
    {
        heading: '7. Vulnerability Reporting',
        body:
            'If you discover a security vulnerability in Medicoo, please report it responsibly to ' +
            'security@medicoo.in rather than disclosing it publicly. We investigate all credible reports and will ' +
            'acknowledge receipt within a reasonable timeframe.'
    },
    {
        heading: '8. Your Responsibility',
        body:
            'Security is a shared responsibility. Keep your device passcode enabled, avoid using Medicoo on shared ' +
            'or public devices while logged in, and log out if you use a device that isn’t your own.'
    },
    {
        heading: '9. Policy Updates',
        body:
            'These standards may be updated as our infrastructure and practices evolve. Material changes will be ' +
            'reflected here.'
    },
];

// Content is backend-managed (admin-editable) rather than hardcoded, same
// as PrivacyPolicyScreen/TermsOfServiceScreen - once the backend supports
// this document type. LegalPage renders its own unified header.
export default function SecurityStandardsScreen() {
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
