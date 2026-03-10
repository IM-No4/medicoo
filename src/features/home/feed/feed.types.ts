export type HomeFeedItemType =
  | 'PROMO'
  | 'HEALTH_TIP'
  | 'REMINDER'
  | 'UPCOMING_APPOINTMENT'
  | 'PRODUCT_SHOWCASE'
  | 'DOCTOR_RECOMMENDATION'
  | 'LAB_PACKAGE_SHOWCASE'
  | 'HEALTH_ARTICLE_SHOWCASE'
  | 'HOSPITAL_SHOWCASE'
  | 'HOME_CARE_SHOWCASE'
  | 'CONTINUE_ACTIVITY'
  | 'FAMILY_OVERVIEW'
  | 'RECENT_ACTIVITY'
  | 'TRUST_SIGNAL'
  | 'BLOOD_DONATION_AWARENESS'
  | 'BLOOD_REQUEST_ALERT'
  | 'QUICK_ACTIONS'
  | 'SERVICES_SECTION'
  | 'DYNAMIC_HEADER'
  | 'UPCOMING_SECTION'
  | 'HEALTH_SUMMARY'
  | 'SEASONAL_ESSENTIALS'
  | 'HOME_FEED_FOOTER';

export interface SeasonalCollection {
  id: string;
  name: string;
  image?: string;
  icon?: string;
  tags: string[];
  iconColor?: string;
  iconBackgroundColor?: string;
  action?: FeedAction;
}

export interface SeasonalEssentialsFeedItem extends HomeFeedItemBase {
  type: 'SEASONAL_ESSENTIALS';
  title: string;
  subtitle?: string;
  season: 'SUMMER' | 'WINTER' | 'MONSOON' | 'SPRING';
  collections: SeasonalCollection[];
  theme?: {
    gradient?: string[];
    backgroundColor?: string;
    backgroundImage?: string;
    lottieUrl?: string;
    accentColor?: string;
    textColor?: string;
    sparkleColor?: string;
  };
}

export interface DynamicHeaderFeedItem extends HomeFeedItemBase {
  type: 'DYNAMIC_HEADER';
  colors: string[];
  greeting?: string;
  userName?: string;
  showLocationSelector?: boolean;
  showSearchBar?: boolean;
}

export interface UpcomingSectionFeedItem extends HomeFeedItemBase {
  type: 'UPCOMING_SECTION';
  title: string;
  seeAllAction?: FeedAction;
}

export interface HealthSummaryFeedItem extends HomeFeedItemBase {
  type: 'HEALTH_SUMMARY';
  title: string;
}

export interface HomeFeedFooterFeedItem extends HomeFeedItemBase {
  type: 'HOME_FEED_FOOTER';
  appName: string;
  tagline: string;
}

export interface QuickActionItem {
  id: string;
  title: string;
  icon: string;
  action: FeedAction;
  background: { start: string; end: string };
  accentColor: string;
}

export interface QuickActionsFeedItem extends HomeFeedItemBase {
  type: 'QUICK_ACTIONS';
  items: QuickActionItem[];
}

export interface ServiceSectionItem {
  id: string;
  title: string;
  icon: string;
  enabled?: boolean;
  background: { start: string; end: string };
  accentColor: string;
  action: FeedAction;
}

export interface ServicesSectionFeedItem extends HomeFeedItemBase {
  type: 'SERVICES_SECTION';
  title: string;
  services: ServiceSectionItem[];
}

export interface BloodDonationAwarenessFeedItem extends HomeFeedItemBase {
  type: 'BLOOD_DONATION_AWARENESS';
  title: string;
  subtitle: string;
  ctaText: string;
  learnMoreAction?: FeedAction;
}

export interface BloodRequestAlertFeedItem extends HomeFeedItemBase {
  type: 'BLOOD_REQUEST_ALERT';
  hospital: string;
  location: string;
  bloodGroup: string;
  urgencyLevel: 'HIGH' | 'CRITICAL';
  distance: string;
  timePosted: string;
  acceptAction?: FeedAction;
  declineAction?: FeedAction;
}

// ... existing interfaces ...



import { FeedAction } from './feed.actions';

export interface HomeFeedItemBase {
  id: string;
  type: HomeFeedItemType;
  action?: FeedAction;
}

export interface ContinueActivityFeedItem extends HomeFeedItemBase {
  type: 'CONTINUE_ACTIVITY';
  title: string;
  subtitle: string;
  ctaText: string;
  icon: string;
  progress?: number; // 0 to 1
  actionIdentifier: string;
}

export interface FamilyMemberSummary {
  id: string;
  name: string;
  relation: string;
  image?: string;
  alerts?: number;
  statusText?: string; // e.g., "Meds missed"
}

export interface FamilyOverviewFeedItem extends HomeFeedItemBase {
  type: 'FAMILY_OVERVIEW';
  title: string;
  members: FamilyMemberSummary[];
}

export interface RecentActivitySummary {
  id: string;
  type: 'consultation' | 'medicine' | 'lab';
  title: string;
  date: string;
  status: string;
  statusColor?: string;
}

export interface RecentActivityFeedItem extends HomeFeedItemBase {
  type: 'RECENT_ACTIVITY';
  title: string;
  activities: RecentActivitySummary[];
}

export interface TrustSignalFeedItem extends HomeFeedItemBase {
  type: 'TRUST_SIGNAL';
  title: string;
  description: string;
  icon: string;
  shieldLevel?: 'standard' | 'verified' | 'premium';
}

// ... existing interfaces ...

export type HomeFeedItem =
  | PromoFeedItem
  | HealthTipFeedItem
  | ReminderFeedItem
  | UpcomingAppointmentFeedItem
  | ProductShowcaseFeedItem
  | DoctorRecommendationFeedItem
  | LabPackageShowcaseFeedItem
  | HealthArticleShowcaseFeedItem
  | HospitalShowcaseFeedItem
  | HomeCareShowcaseFeedItem
  | ContinueActivityFeedItem
  | FamilyOverviewFeedItem
  | RecentActivityFeedItem
  | TrustSignalFeedItem
  | BloodDonationAwarenessFeedItem
  | BloodRequestAlertFeedItem
  | QuickActionsFeedItem
  | ServicesSectionFeedItem
  | DynamicHeaderFeedItem
  | UpcomingSectionFeedItem
  | HealthSummaryFeedItem
  | SeasonalEssentialsFeedItem
  | HomeFeedFooterFeedItem;

export interface HomeCareService {
  id: string;
  title: string;
  provider: string;
  rating: number;
  price: number;
  duration: string;
  image?: string;
  features: string[];
  action?: FeedAction;
}

export interface HomeCareShowcaseFeedItem extends HomeFeedItemBase {
  type: 'HOME_CARE_SHOWCASE';
  title: string;
  subtitle?: string;
  services: HomeCareService[];
  seeAllAction?: FeedAction;
}

// ... existing types

export interface Hospital {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  image?: string;
  facilities: string[];
  action?: FeedAction;
}

export interface HospitalShowcaseFeedItem extends HomeFeedItemBase {
  type: 'HOSPITAL_SHOWCASE';
  title: string;
  subtitle?: string;
  hospitals: Hospital[];
  seeAllAction?: FeedAction;
}

// ... (Rest of existing types)



export interface LabPackage {
  id: string;
  title: string;
  testCount: number;
  includes: string[];
  price: number;
  originalPrice?: number;
  discount?: string;
  tat: string; // Turn Around Time e.g. "24 hrs"
  action?: FeedAction;
}

export interface LabPackageShowcaseFeedItem extends HomeFeedItemBase {
  type: 'LAB_PACKAGE_SHOWCASE';
  title: string;
  subtitle?: string;
  packages: LabPackage[];
  seeAllAction?: FeedAction;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  readTime: string;
  imageUrl?: string;
  author?: string;
  action?: FeedAction;
}

export interface HealthArticleShowcaseFeedItem extends HomeFeedItemBase {
  type: 'HEALTH_ARTICLE_SHOWCASE';
  title: string;
  subtitle?: string;
  articles: Article[];
  seeAllAction?: FeedAction;
}


export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: string;
  image?: string;
  nextAvailable?: string;
  action?: FeedAction;
}

// ... existing types

export interface DoctorRecommendationFeedItem extends HomeFeedItemBase {
  type: 'DOCTOR_RECOMMENDATION';
  title: string;
  subtitle?: string;
  doctors: Doctor[];
  seeAllAction?: FeedAction; // Add explicit see all action too
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image?: string;
  uom?: string;
  unit?: string;
  brand?: string;
  action?: FeedAction;
}

export interface ShowcaseSection {
  id: string;
  title: string;
  imageUrl?: string;
  tags?: string[];
  displayOrder?: number;
  action?: FeedAction;
}

export interface ProductShowcaseFeedItem extends HomeFeedItemBase {
  type: 'PRODUCT_SHOWCASE';
  title: string;
  subtitle?: string;
  products?: Product[];
  sections?: ShowcaseSection[];
  showcaseId?: string;
  seeAllAction?: FeedAction;
}

export interface PromoItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  ctaText?: string;
  background?: { start: string; end: string };
  imageUrl?: string;
  icon?: string;
  action?: FeedAction;
}

export interface PromoFeedItem extends HomeFeedItemBase {
  type: 'PROMO';
  displayMode: 'LIST' | 'CAROUSEL';
  items: PromoItem[];
}

export interface HealthTipFeedItem extends HomeFeedItemBase {
  type: 'HEALTH_TIP';
  title: string;
  content: string;
  accentColor?: string;
  icon?: string;
  tags?: string[];
}

export interface ReminderFeedItem extends HomeFeedItemBase {
  type: 'REMINDER';
  text: string;
  dueAt: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface UpcomingAppointmentFeedItem extends HomeFeedItemBase {
  type: 'UPCOMING_APPOINTMENT';
  doctorName: string;
  specialty: string;
  time: string;
  avatarUrl?: string;
}


