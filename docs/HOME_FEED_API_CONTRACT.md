
# API Contract: Server-Driven Home Feed

This document defines the API contract for the purely data-driven Home Feed. The frontend is a dumb renderer that strictly iterates over this JSON response.

## Endpoint

- **Method**: `GET`
- **URL**: `/api/v1/home/feed`
- **Query Parameters**:
  - `cursor` (string, optional): For pagination. Pass the `nextCursor` from the previous response.
  - `limit` (integer, optional): Number of items to fetch (default: 10).
  - `user_id` (string, optional): Context for personalization.

## Response Structure

```json
{
  "status": "success",
  "data": {
    "feed": [
      // ... Array of Feed Items (see Item Types below)
    ],
    "meta": {
      "hasMore": true,
      "nextCursor": "eyJpZCI6IjYifQ=="
    }
  }
}
```

---

## Action Object (FeedAction)

Any interactive element (button, card tap, link) uses this standard Action objects.

| Field | Type | Description |
| :--- | :--- | :--- |
| `type` | string | `NAVIGATE`, `OPEN_MODAL`, `SHOW_TOAST`, `OPEN_URL` |
| `stack` | string? | For `NAVIGATE`. Target Navigator (e.g., `HomeStack`, `PharmacyStack`). |
| `screen` | string? | For `NAVIGATE`. Target Screen. |
| `params` | object? | For `NAVIGATE`. Params passed to screen (e.g., `{ "productId": "123" }`). |
| `url` | string? | For `OPEN_URL`. |
| `modalId` | string? | For `OPEN_MODAL`. (e.g., `DONATION_CONFIRM`). |
| `data` | object? | Data for modals. |
| `message` | string? | For `SHOW_TOAST`. |
| `variant` | string? | For `SHOW_TOAST` (`success`, `error`, `info`). |

---

## Item Types

Every item in the `feed` array has a `type` field that determines the component to render.

### 1. Promo Card (`PROMO`)
High visibility marketing banners.

```json
{
  "id": "promo_1",
  "type": "PROMO",
  "title": "Full Body Checkup",
  "subtitle": "Includes 89 tests",
  "description": "Special offer only for today.",
  "ctaText": "Book Now",
  "background": { "start": "#8B5CF6", "end": "#6D28D9" },
  "imageUrl": "https://example.com/promo.png",
  "action": { "type": "NAVIGATE", "stack": "LabStack", "screen": "PackageDetail", "params": { "id": "pkg1" } }
}
```

### 2. Blood Request Alert (`BLOOD_REQUEST_ALERT`)
Urgent alerts for blood donation.

```json
{
  "id": "alert_1",
  "type": "BLOOD_REQUEST_ALERT",
  "hospital": "City Hospital",
  "location": "Sector 62",
  "bloodGroup": "O+",
  "urgencyLevel": "CRITICAL",
  "distance": "2.5 km",
  "timePosted": "10 mins ago",
  "acceptAction": { "type": "OPEN_MODAL", "modalId": "DONATION_CONFIRM", "data": { "requestId": "alert_1" } },
  "declineAction": { "type": "SHOW_TOAST", "message": "Declined", "variant": "info" }
}
```

### 3. Blood Donation Awareness (`BLOOD_DONATION_AWARENESS`)
Educational/Motivational card.

```json
{
  "id": "aware_1",
  "type": "BLOOD_DONATION_AWARENESS",
  "title": "Donate Blood Today",
  "subtitle": "You can save 3 lives.",
  "ctaText": "Check Eligibility",
  "action": { "type": "NAVIGATE", "stack": "ProfileStack", "screen": "Eligibility" },
  "learnMoreAction": { "type": "OPEN_URL", "url": "https://medicoo.in/donate-blood" }
}
```

### 4. Doctor Recommendation (`DOCTOR_RECOMMENDATION`)
Horizontal scroll of doctor cards.

```json
{
  "id": "doc_sec_1",
  "type": "DOCTOR_RECOMMENDATION",
  "title": "Top Doctors Near You",
  "subtitle": "Highly rated specialists",
  "seeAllAction": { "type": "NAVIGATE", "stack": "DoctorStack", "screen": "DoctorList" },
  "doctors": [
    {
      "id": "d1",
      "name": "Dr. Smith",
      "specialty": "Cardiologist",
      "rating": 4.9,
      "experience": "12 years",
      "image": "https://example.com/doc1.jpg",
      "action": { "type": "NAVIGATE", "stack": "DoctorStack", "screen": "DoctorDetail", "params": { "doctorId": "d1" } }
    }
  ]
}
```

### 5. Product Showcase (`PRODUCT_SHOWCASE`)
Horizontal scroll of products.

```json
{
  "id": "prod_sec_1",
  "type": "PRODUCT_SHOWCASE",
  "title": "Essentials",
  "subtitle": "Daily needs",
  "seeAllAction": { "type": "NAVIGATE", "stack": "PharmacyStack", "screen": "ProductList" },
  "products": [
    {
      "id": "p1",
      "name": "Paracetamol",
      "price": 50,
      "originalPrice": 60,
      "discount": "10%",
      "uom": "Strip of 10",
      "image": "https://example.com/p1.jpg",
      "action": { "type": "NAVIGATE", "stack": "PharmacyStack", "screen": "ProductDetail", "params": { "productId": "p1" } }
    }
  ]
}
```

### 6. Lab Package Showcase (`LAB_PACKAGE_SHOWCASE`)
Lab tests.

```json
{
  "id": "lab_sec_1",
  "type": "LAB_PACKAGE_SHOWCASE",
  "title": "Health Checkups",
  "seeAllAction": { "type": "NAVIGATE", "stack": "LabStack", "screen": "PackageList" },
  "packages": [
    {
      "id": "l1",
      "title": "Full Body",
      "testCount": 60,
      "includes": ["CBC", "Lipid"],
      "price": 999,
      "tat": "24 hrs",
      "action": { "type": "NAVIGATE", "stack": "LabStack", "screen": "PackageDetail", "params": { "packageId": "l1" } }
    }
  ]
}
```

### 7. Hospital Showcase (`HOSPITAL_SHOWCASE`)
Nearby hospitals.

```json
{
  "id": "hosp_sec_1",
  "type": "HOSPITAL_SHOWCASE",
  "title": "Nearby Hospitals",
  "seeAllAction": { "type": "NAVIGATE", "stack": "HospitalStack", "screen": "HospitalList" },
  "hospitals": [
    {
      "id": "h1",
      "name": "Max Hospital",
      "address": "Delhi",
      "distance": "2 km",
      "rating": 4.5,
      "facilities": ["ICU", "Emergency"],
      "action": { "type": "NAVIGATE", "stack": "HospitalStack", "screen": "HospitalDetail", "params": { "hospitalId": "h1" } }
    }
  ]
}
```

### 8. Health Articles (`HEALTH_ARTICLE_SHOWCASE`)
Blog content.

```json
{
  "id": "art_sec_1",
  "type": "HEALTH_ARTICLE_SHOWCASE",
  "title": "Health Tips",
  "seeAllAction": { "type": "OPEN_URL", "url": "https://medicoo.in/blog" },
  "articles": [
    {
      "id": "a1",
      "title": "Keto Diet 101",
      "category": "Diet",
      "readTime": "5 min",
      "action": { "type": "OPEN_URL", "url": "https://medicoo.in/blog/keto-diet" }
    }
  ]
}
```

### 9. Health Tip (`HEALTH_TIP`)
Simple tip card.

```json
{
  "id": "tip_1",
  "type": "HEALTH_TIP",
  "title": "Did you know?",
  "content": "Drinking water aids digestion.",
  "accentColor": "#3B82F6",
  "icon": "droplet"
}
```

### 10. Reminder (`REMINDER`)
Medication or task reminder.

```json
{
  "id": "rem_1",
  "type": "REMINDER",
  "text": "Take Vitamin C",
  "dueAt": "10:00 AM",
  "priority": "high",
  "action": { "type": "NAVIGATE", "stack": "MedicineStack", "screen": "Tracker" }
}
```

### 11. Upcoming Appointment (`UPCOMING_APPOINTMENT`)
Next scheduled doctor visit.

```json
{
  "id": "appt_1",
  "type": "UPCOMING_APPOINTMENT",
  "doctorName": "Dr. Jones",
  "specialty": "Dentist",
  "time": "Tomorrow, 10:00 AM",
  "avatarUrl": "https://...",
  "action": { "type": "NAVIGATE", "stack": "DoctorStack", "screen": "AppointmentDetail", "params": { "id": "appt_1" } }
}
```

### 12. Continue Activity (`CONTINUE_ACTIVITY`)
Resume a dropped flow.

```json
{
  "id": "cont_1",
  "type": "CONTINUE_ACTIVITY",
  "title": "Complete your booking",
  "subtitle": "Dr. Sharma",
  "ctaText": "Resume",
  "icon": "calendar",
  "progress": 0.8,
  "actionIdentifier": "booking_123",
  "action": { "type": "NAVIGATE", "stack": "DoctorStack", "screen": "BookingFlow", "params": { "step": 3 } }
}
```

### 13. Trust Signal (`TRUST_SIGNAL`)
Trust and security signals.

```json
{
  "id": "trust_1",
  "type": "TRUST_SIGNAL",
  "title": "Verified & Secure",
  "description": "All doctors are manually verified.",
  "icon": "shield-check",
  "shieldLevel": "verified"
}
```

### 14. Quick Actions (`QUICK_ACTIONS`)
Shortcut icons for primary features.

```json
{
  "id": "qa_1",
  "type": "QUICK_ACTIONS",
  "items": [
    {
      "id": "doctor",
      "title": "Doctor",
      "icon": "stethoscope",
      "background": { "start": "#ffffff", "end": "#ffffff" },
      "accentColor": "#0284C7",
      "action": { "type": "NAVIGATE", "stack": "DoctorStack", "screen": "DoctorList" }
    }
  ]
}
```

### 15. Services Section (`SERVICES_SECTION`)
Horizontal scrolling list of services.

```json
{
  "id": "srv_1",
  "type": "SERVICES_SECTION",
  "title": "SERVICES",
  "services": [
    {
      "id": "pharmacy",
      "title": "Pharmacy",
      "icon": "pill",
      "enabled": true,
      "background": { "start": "#34d399", "end": "#059669" },
      "accentColor": "#ffffff",
      "action": { "type": "NAVIGATE", "stack": "PharmacyStack", "screen": "PharmacyList" }
    }
  ]
}
```
