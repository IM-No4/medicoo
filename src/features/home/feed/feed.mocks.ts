
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
            { id: 'ambulance', title: 'Ambulance', icon: 'ambulance', enabled: true, accentColor: '#ffffff', background: { start: '#fb7185', end: '#e11d48' }, action: { type: 'NAVIGATE', stack: 'AmbulanceStack', screen: 'AmbulanceHome' } },
            { id: 'homecare', title: 'Home Care', icon: 'heart', enabled: true, accentColor: '#ffffff', background: { start: '#9ca3af', end: '#6b7280' }, action: { type: 'NAVIGATE', stack: 'HomeCareStack', screen: 'ServiceList' } },
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
        id: 'continue1',
        type: 'CONTINUE_ACTIVITY',
        title: 'Booking Dr. Sharma',
        subtitle: 'Continue from where you left',
        ctaText: 'Resume',
        icon: 'calendar',
        progress: 0.8,
        actionIdentifier: 'RESUME_BOOKING'
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
    },
    {
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
            backgroundColor: '#FFF7ED', // Light Peach solid color
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
        ctaText: 'Check Eligibility',
        action: {
            type: 'NAVIGATE',
            stack: 'ProfileStack',
            screen: 'ProfileHome' // Placeholder for Eligibility check
        },
        learnMoreAction: {
            type: 'OPEN_URL',
            url: 'https://medicoo.com/donate-blood'
        }
    },
    {
        id: '3',
        type: 'PROMO',
        title: 'Medicine Delivery',
        subtitle: 'Express',
        description: 'Get your medicines delivered within 2 hours in your area.',
        ctaText: 'Order Now',
        background: { start: '#059669', end: '#10B981' },
        icon: 'pill',
    },
    {
        id: 'lab1',
        type: 'LAB_PACKAGE_SHOWCASE',
        title: 'Popular Health Checks',
        subtitle: 'Comprehensive packages for you',
        seeAllAction: { type: 'NAVIGATE', stack: 'LabStack', screen: 'LabTests' },
        packages: [
            {
                id: 'pkg1',
                title: 'Comprehensive Full Body Checkup',
                testCount: 89,
                includes: ['Vitamin D', 'B12', 'Thyroid', 'Liver', 'Kidney', 'CBC'],
                price: 1499,
                originalPrice: 3999,
                discount: '62%',
                tat: '24 hrs',
                action: { type: 'NAVIGATE', stack: 'LabStack', screen: 'LabPackageDetail', params: { packageId: 'pkg1' } }
            },
            {
                id: 'pkg2',
                title: 'Diabetes Screening Package',
                testCount: 45,
                includes: ['HbA1c', 'Fasting Blood Sugar', 'Lipid Profile'],
                price: 799,
                originalPrice: 1999,
                discount: '60%',
                tat: '12 hrs',
                action: { type: 'NAVIGATE', stack: 'LabStack', screen: 'LabPackageDetail', params: { packageId: 'pkg2' } }
            },
            {
                id: 'pkg3',
                title: 'Women Health Advanced',
                testCount: 65,
                includes: ['Thyroid', 'Hormones', 'CBC', 'Calcium'],
                price: 1999,
                originalPrice: 4200,
                discount: '52%',
                tat: '36 hrs',
                action: { type: 'NAVIGATE', stack: 'LabStack', screen: 'LabPackageDetail', params: { packageId: 'pkg3' } }
            },
        ]
    },
    {
        id: 's2',
        type: 'PRODUCT_SHOWCASE',
        title: 'Baby Care',
        subtitle: 'Gentle care for your little one',
        products: [
            { id: 'b1', name: 'Pampers Active Baby', price: 699, originalPrice: 799, discount: '15%', uom: '30 pants' },
            { id: 'b2', name: 'Johnson Baby Oil', price: 250, uom: '200ml' },
            { id: 'b3', name: 'Himalaya Baby Lotion', price: 180, originalPrice: 200, discount: '10%', uom: '100ml' },
            { id: 'b4', name: 'Cerelac Wheat Apple', price: 290, uom: '300g' },
        ]
    },
    {
        id: 's3',
        type: 'PRODUCT_SHOWCASE',
        title: 'Women\'s Wellness',
        subtitle: 'Hygiene & Self-care',
        products: [
            { id: 'w1', name: 'Whisper Ultra Clean', price: 380, originalPrice: 450, discount: '15%', uom: '30 pads' },
            { id: 'w2', name: 'V-Wash Plus', price: 190, uom: '100ml' },
            { id: 'w3', name: 'Revital H Woman', price: 280, originalPrice: 310, discount: '10%', uom: '30 caps' },
        ]
    },
    {
        id: 'articles1',
        type: 'HEALTH_ARTICLE_SHOWCASE',
        title: 'Health Knowledge Hub',
        subtitle: 'Trending health insights',
        seeAllAction: { type: 'OPEN_URL', url: 'https://medicoo.com/blog' },
        articles: [
            { id: 'a1', title: 'Start your Keto Diet', category: 'Nutrition', readTime: '5 min read', author: 'Dr. A. Gupta', action: { type: 'OPEN_URL', url: 'https://medicoo.com/blog/keto-diet' } },
            { id: 'a2', title: 'Best Exercises for Back Pain', category: 'Physiotherapy', readTime: '4 min read', author: 'Dr. S. Khan', action: { type: 'OPEN_URL', url: 'https://medicoo.com/blog/back-pain' } },
            { id: 'a3', title: 'Understanding Diabetes Types', category: 'Disease', readTime: '7 min read', author: 'Dr. M. Roy', action: { type: 'OPEN_URL', url: 'https://medicoo.com/blog/diabetes-types' } },
        ]
    },
    {
        id: 's4',
        type: 'PRODUCT_SHOWCASE',
        title: 'Sexual Wellness',
        subtitle: 'Discreet delivery',
        products: [
            { id: 'sx1', name: 'Durex Extra Time', price: 180, originalPrice: 200, discount: '10%', uom: '10s', action: { type: 'NAVIGATE', stack: 'PharmacyStack', screen: 'ProductDetail', params: { productId: 'sx1' } } },
            { id: 'sx2', name: 'Manforce Strawberry', price: 90, uom: '10s', action: { type: 'NAVIGATE', stack: 'PharmacyStack', screen: 'ProductDetail', params: { productId: 'sx2' } } },
            { id: 'sx3', name: 'Skore Vibrating Ring', price: 450, originalPrice: 500, discount: '10%', action: { type: 'NAVIGATE', stack: 'PharmacyStack', screen: 'ProductDetail', params: { productId: 'sx3' } } },
        ]
    },
    {
        id: 'hosp1',
        type: 'HOSPITAL_SHOWCASE',
        title: 'Hospitals Near You',
        subtitle: 'Emergency & Specialized Care',
        seeAllAction: { type: 'NAVIGATE', stack: 'HospitalStack', screen: 'HospitalFeed' },
        hospitals: [
            { id: 'h1', name: 'City Care Hospital', address: 'Sector 62, Noida', distance: '2.5 km', rating: 4.5, facilities: ['ICU', 'Emergency', 'X-Ray'], action: { type: 'NAVIGATE', stack: 'HospitalStack', screen: 'HospitalDetail', params: { hospitalId: 'h1' } } },
            { id: 'h2', name: 'Max Super Specialty', address: 'Patparganj, Delhi', distance: '5.2 km', rating: 4.8, facilities: ['Multi-Specialty', 'MRI', 'Blood Bank'], action: { type: 'NAVIGATE', stack: 'HospitalStack', screen: 'HospitalDetail', params: { hospitalId: 'h2' } } },
            { id: 'h3', name: 'Apollo Clinic', address: 'Indirapuram', distance: '3.0 km', rating: 4.2, facilities: ['OPD', 'Pharmacy', 'Lab'], action: { type: 'NAVIGATE', stack: 'HospitalStack', screen: 'HospitalDetail', params: { hospitalId: 'h3' } } },
        ]
    },
    {
        id: 'hc1',
        type: 'HOME_CARE_SHOWCASE',
        title: 'Home Care & Nursing',
        subtitle: 'Expert care at your doorstep',
        seeAllAction: { type: 'NAVIGATE', stack: 'HomeCareStack', screen: 'ServiceList' },
        services: [
            { id: 'srv1', title: 'Physiotherapy at Home', provider: 'Portea Medical', rating: 4.7, price: 499, duration: '45 mins', features: ['Certified Physio', 'Post-surgery Rehab'], action: { type: 'NAVIGATE', stack: 'HomeCareStack', screen: 'ServiceDetail', params: { serviceId: 'srv1' } } },
            { id: 'srv2', title: 'Nursing Care - 12 Hrs', provider: 'Care24', rating: 4.6, price: 1200, duration: '12 hrs', features: ['Vital Monitoring', 'Medication Admin'], action: { type: 'NAVIGATE', stack: 'HomeCareStack', screen: 'ServiceDetail', params: { serviceId: 'srv2' } } },
            { id: 'srv3', title: 'Elderly Companion', provider: 'Emoha Elder Care', rating: 4.8, price: 800, duration: '4 hrs', features: ['Daily Assistance', 'Companionship'], action: { type: 'NAVIGATE', stack: 'HomeCareStack', screen: 'ServiceDetail', params: { serviceId: 'srv3' } } },
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
