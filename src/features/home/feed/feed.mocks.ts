import { BLOG_URL, DONATE_BLOOD_URL } from '@/src/config/env';

import { HomeFeedItem } from './feed.types';

export const FULL_FEED: HomeFeedItem[] = [
    {
        id: 'header_1',
        type: 'DYNAMIC_HEADER',
        colors: ['#2FA561', '#0E7439'],
        greeting: 'Good morning',
        userName: 'Amrit',
        showLocationSelector: true,
        showSearchBar: true,
    },
    {
        id: 'quick_actions_1',
        type: 'QUICK_ACTIONS',
        items: [
            { id: 'doctor', title: 'Doctor', icon: 'stethoscope', action: { type: 'NAVIGATE', stack: 'DoctorStack', screen: 'DoctorList' }, background: { start: '#ffffffff', end: '#ffffffff' }, accentColor: '#0284C7' },
            { id: 'medicines', title: 'Medicines', icon: 'pill', action: { type: 'NAVIGATE', stack: 'PharmacyStack', screen: 'PharmacyList' }, background: { start: '#ffffffff', end: '#ffffffff' }, accentColor: '#15803D' },
            { id: 'upload', title: 'Upload Rx', icon: 'notepad-text', action: { type: 'OPEN_MODAL', modalId: 'UPLOAD_RX' }, background: { start: '#ffffffff', end: '#ffffffff' }, accentColor: '#B45309' },
            { id: 'lab', title: 'Lab Tests', icon: 'flask', action: { type: 'NAVIGATE', stack: 'LabStack', screen: 'LabList' }, background: { start: '#ffffffff', end: '#ffffffff' }, accentColor: '#7C3AED' },
        ]
    },
    {
        id: 'services_1',
        type: 'SERVICES_SECTION',
        title: 'SERVICES',
        services: [
            { id: 'doctors', title: 'Doctors', icon: 'stethoscope', enabled: true, accentColor: '#ffffff', background: { start: '#4f9cff', end: '#2563eb' }, action: { type: 'NAVIGATE', stack: 'DoctorStack', screen: 'DoctorList' } },
            { id: 'pharmacy', title: 'Pharmacy', icon: 'pill', enabled: true, accentColor: '#ffffff', background: { start: '#34d399', end: '#059669' }, action: { type: 'NAVIGATE', stack: 'PharmacyStack', screen: 'PharmacyList' } },
            { id: 'labs', title: 'Path Labs', icon: 'flask', enabled: true, accentColor: '#ffffff', background: { start: '#fbbf24', end: '#f59e0b' }, action: { type: 'NAVIGATE', stack: 'LabStack', screen: 'LabList' } },
            { id: 'hospitals', title: 'Hospitals', icon: 'hospital', enabled: true, accentColor: '#ffffff', background: { start: '#a78bfa', end: '#7c3aed' }, action: { type: 'NAVIGATE', stack: 'HospitalStack', screen: 'HospitalFeed' } },
        ]
    },
    {
        id: 'upcoming_1',
        type: 'UPCOMING_SECTION',
        title: 'Upcoming',
    },
    {
        id: 'health_summary_1',
        type: 'HEALTH_SUMMARY',
        title: 'Health Summary',
    },
    {
        id: 'blood_alert_1',
        type: 'BLOOD_REQUEST_ALERT',
        hospital: 'Max Super Specialty Hospital',
        location: 'Patparganj, Delhi',
        bloodGroup: 'O+',
        urgencyLevel: 'CRITICAL',
        distance: '3.2 km',
        timePosted: '12 mins ago',
        acceptAction: {
            type: 'OPEN_MODAL',
            modalId: 'DONATION_CONFIRM',
            data: { requestId: 'blood_alert_1' }
        },
        declineAction: {
            type: 'SHOW_TOAST',
            message: 'Response recorded. Thank you.',
            variant: 'info'
        }
    },
    {
        id: 'family1',
        type: 'FAMILY_OVERVIEW',
        title: 'My Family',
        members: [
            { id: 'm1', name: 'Rahul (You)', relation: 'Self', alerts: 0 },
            { id: 'm2', name: 'Priya', relation: 'Wife', alerts: 1, statusText: 'Meds Missed' },
            { id: 'm3', name: 'Aarav', relation: 'Son', alerts: 0 },
        ]
    },
    {
        id: '1',
        type: 'PROMO',
        displayMode: 'LIST',
        items: [
            {
                id: 'p1_1',
                title: 'Full Body Checkup',
                subtitle: 'Special Offer',
                description: 'Get 60+ tests including Vitamin D & B12 at 50% off.',
                ctaText: 'Book Now',
                background: { start: '#4F46E5', end: '#7C3AED' },
                icon: 'flask',
                action: {
                    type: 'NAVIGATE',
                    screen: 'LabTests',
                    stack: 'LabStack',
                    params: {
                        searchQuery: 'Sugar Test',
                        filterCategory: 'Diabetes'
                    }
                }
            }
        ]
    }, {
        id: 'd1',
        type: 'DOCTOR_RECOMMENDATION',
        title: 'Top Rated Doctors',
        subtitle: 'Based on your location',
        seeAllAction: { type: 'NAVIGATE', stack: 'DoctorStack', screen: 'DoctorList' },
        doctors: [
            { id: 'dr1', name: 'Dr. Sarah Wilson', specialty: 'Cardiologist', rating: 4.9, experience: '12 Yrs', action: { type: 'NAVIGATE', stack: 'DoctorStack', screen: 'DoctorDetail', params: { doctorId: 'dr1' } } },
            { id: 'dr2', name: 'Dr. James Chen', specialty: 'Dermatologist', rating: 4.8, experience: '8 Yrs', action: { type: 'NAVIGATE', stack: 'DoctorStack', screen: 'DoctorDetail', params: { doctorId: 'dr2' } } },
            { id: 'dr3', name: 'Dr. Anita Roy', specialty: 'Pediatrician', rating: 4.9, experience: '15 Yrs', action: { type: 'NAVIGATE', stack: 'DoctorStack', screen: 'DoctorDetail', params: { doctorId: 'dr3' } } },
            { id: 'dr4', name: 'Dr. Raj Patel', specialty: 'General Physician', rating: 4.7, experience: '10 Yrs', action: { type: 'NAVIGATE', stack: 'DoctorStack', screen: 'DoctorDetail', params: { doctorId: 'dr4' } } },
        ]
    },
    {
        id: '2',
        type: 'HEALTH_TIP',
        title: 'Hydration',
        content: 'Drinking water before meals can help you feel fuller and aid in weight management. Aim for 2.5L daily.',
        tags: ['Wellness', 'Diet'],
        accentColor: '#0EA5E9',
        icon: 'droplet',
    },
    {
        id: 's1',
        type: 'SEASONAL_ESSENTIALS',
        title: 'Seasonal Health Essentials',
        subtitle: 'Summer Care',
        season: 'SUMMER',
        collections: [
            { id: 'c1', name: 'Sunscreen', tags: ['sunscreen', 'summer'], icon: 'sun', iconColor: '#F59E0B', iconBackgroundColor: '#FEF3C7', action: { type: 'NAVIGATE', stack: 'SearchStack', screen: 'SearchHome', params: { query: 'sunscreen' } } },
            { id: 'c2', name: 'Repellents', tags: ['repellent', 'mosquito'], icon: 'bug', iconColor: '#10B981', iconBackgroundColor: '#DCFCE7', action: { type: 'NAVIGATE', stack: 'SearchStack', screen: 'SearchHome', params: { query: 'repellent' } } },
            { id: 'c3', name: 'Hydration', tags: ['hydration', 'electrolytes'], icon: 'droplet', iconColor: '#3B82F6', iconBackgroundColor: '#DBEAFE', action: { type: 'NAVIGATE', stack: 'SearchStack', screen: 'SearchHome', params: { query: 'hydration' } } },
            { id: 'c4', name: 'Cooling Gel', tags: ['cooling', 'gel'], icon: 'snowflake', iconColor: '#0EA5E9', iconBackgroundColor: '#E0F2FE', action: { type: 'NAVIGATE', stack: 'SearchStack', screen: 'SearchHome', params: { query: 'cooling gel' } } },
            { id: 'c5', name: 'Allergy Meds', tags: ['allergy', 'antihistamine'], icon: 'flower', iconColor: '#EC4899', iconBackgroundColor: '#FCE7F3', action: { type: 'NAVIGATE', stack: 'SearchStack', screen: 'SearchHome', params: { query: 'allergy' } } },
            { id: 'c6', name: 'After Sun', tags: ['after-sun', 'aloe'], icon: 'thermometer', iconColor: '#F43F5E', iconBackgroundColor: '#FFE4E6', action: { type: 'NAVIGATE', stack: 'SearchStack', screen: 'SearchHome', params: { query: 'after sun' } } },
        ],
        theme: {
            backgroundColor: '#FFF7ED',
            accentColor: '#EA580C',
            textColor: '#7C2D12',
            sparkleColor: '#F97316',
            lottieUrl: 'https://assets9.lottiefiles.com/packages/lf20_m6cuL6.json'
        }
    },
    {
        id: 'blood_aware_1',
        type: 'BLOOD_DONATION_AWARENESS',
        title: 'You can save a life today',
        subtitle: 'Become a blood donor in your area. Your one act of kindness can make a difference.',
        ctaText: 'Donate Now',
        action: {
            type: 'NAVIGATE',
            stack: 'BloodDonationStack',
            screen: 'BloodDonationDashboard'
        },
        learnMoreAction: {
            type: 'OPEN_URL',
            url: DONATE_BLOOD_URL
        }
    },
    {
        id: '3',
        type: 'PROMO',
        displayMode: 'CAROUSEL',
        items: [
            {
                id: 'p3_1',
                title: 'Medicine Delivery',
                subtitle: 'Express',
                description: 'Get your medicines delivered within 2 hours in your area.',
                ctaText: 'Order Now',
                background: { start: '#059669', end: '#10B981' },
                icon: 'pill',
            }
        ]
    },
    {
        id: 's2',
        type: 'PRODUCT_SHOWCASE',
        title: 'Baby Care',
        subtitle: 'Gentle care for your little one',
        showcaseId: '699212eb1d9e5e39de695aec',
        sections: [
            { id: 'sec2_1', title: 'Daily Essentials', tags: ['essentials', 'baby'], imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500' },
            { id: 'sec2_2', title: 'Diapering', tags: ['diaper', 'hygiene'], imageUrl: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=500' },
            { id: 'sec2_3', title: 'Feeding', tags: ['feeding', 'baby'], imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500' },
        ]
    },
    {
        id: 's3',
        type: 'PRODUCT_SHOWCASE',
        title: 'Women\'s Wellness',
        subtitle: 'Hygiene & Self-care',
        showcaseId: '699215bf1d9e5e39de695b49',
        sections: [
            { id: 'sec3_1', title: 'Menstrual Care', tags: ['pads', 'tampons'], imageUrl: 'https://images.unsplash.com/photo-1584362917165-526a96bcd599?w=500' },
            { id: 'sec3_2', title: 'Intimate Hygiene', tags: ['v-wash', 'hygiene'], imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500' },
        ]
    },
    {
        id: 'articles1',
        type: 'HEALTH_ARTICLE_SHOWCASE',
        title: 'Health Knowledge Hub',
        subtitle: 'Trending health insights',
        seeAllAction: { type: 'OPEN_URL', url: BLOG_URL },
        articles: [
            { id: 'a1', title: 'Start your Keto Diet', category: 'Nutrition', readTime: '5 min read', author: 'Dr. A. Gupta', action: { type: 'OPEN_URL', url: `${BLOG_URL}/keto-diet` } },
            { id: 'a2', title: 'Best Exercises for Back Pain', category: 'Physiotherapy', readTime: '4 min read', author: 'Dr. S. Khan', action: { type: 'OPEN_URL', url: `${BLOG_URL}/back-pain` } },
            { id: 'a3', title: 'Understanding Diabetes Types', category: 'Disease', readTime: '7 min read', author: 'Dr. M. Roy', action: { type: 'OPEN_URL', url: `${BLOG_URL}/diabetes-types` } },
        ]
    },
    {
        id: 's4',
        type: 'PRODUCT_SHOWCASE',
        title: 'Sexual Wellness',
        subtitle: 'Discreet delivery',
        showcaseId: '699215e01d9e5e39de695b5b',
        sections: [
            { id: 'sec4_1', title: 'Condoms', tags: ['condoms', 'protection'], imageUrl: 'https://images.unsplash.com/photo-1605371924599-2d0365ca130a?w=500' },
            { id: 'sec4_2', title: 'Performance', tags: ['delay', 'performance'], imageUrl: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500' },
        ]
    },
    {
        id: 'recent1',
        type: 'RECENT_ACTIVITY',
        title: 'Quick History',
        activities: [
            { id: 'act1', type: 'consultation', title: 'Dr. Sarah Wilson', date: 'Yesterday', status: 'Completed', statusColor: '#10B981' },
            { id: 'act2', type: 'medicine', title: 'Order #40239', date: '2 days ago', status: 'In Transit', statusColor: '#F59E0B' },
            { id: 'act3', type: 'lab', title: 'Blood Test Report', date: '4 days ago', status: 'View Report', statusColor: '#3B82F6' },
            { id: 'act4', type: 'consultation', title: 'Dr. James Miller', date: '1 week ago', status: 'Completed', statusColor: '#10B981' },
            { id: 'act5', type: 'medicine', title: 'Order #40102', date: '2 weeks ago', status: 'Delivered', statusColor: '#10B981' },
            { id: 'act6', type: 'lab', title: 'Lipid Profile Report', date: '3 weeks ago', status: 'View Report', statusColor: '#3B82F6' },
        ]
    },
    {
        id: 'trust1',
        type: 'TRUST_SIGNAL',
        title: 'Verified & Secure',
        description: 'All doctors are verified manually. Your data is 256-bit encrypted.',
        icon: 'shield-check',
        shieldLevel: 'verified'
    },
    {
        id: 'footer_1',
        type: 'HOME_FEED_FOOTER',
        appName: 'Medicoo',
        tagline: "India's Most Trusted Healthcare Platform"
    }
];
