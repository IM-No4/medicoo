import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import HealthSummary from '../components/HealthSummary';
import HeroBannerCard from './cards/HeroBannerCard';
import { GoalsCard } from '../../health/components/GoalsCard';
import HomeFeedFooter from '../components/HomeFeedFooter';
import QuickActions from '../components/QuickActions';
import ServicesSection from '../components/ServicesSection';
import UpcomingSection from '../components/UpcomingSection';
import BloodDonationAwarenessCard from './cards/BloodDonationAwarenessCard';
import BloodRequestAlertCard from './cards/BloodRequestAlertCard';
import CategoryRow from './cards/CategoryRow';
import ContinueActivityCard from './cards/ContinueActivityCard';
import DoctorRecommendationCard from './cards/DoctorRecommendationCard';
import FamilyOverviewCard from './cards/FamilyOverviewCard';
import HealthArticleCard from './cards/HealthArticleCard';
import HealthTipCard from './cards/HealthTipCard';
import HomeCareCard from './cards/HomeCareCard';
import HospitalCard from './cards/HospitalCard';
import LabPackageCard from './cards/LabPackageCard';
import NotServiceableCard from './cards/NotServiceableCard';
import ProductShowcaseCard from './cards/ProductShowcaseCard';
import PromoCard from './cards/PromoCard';
import RecentActivityFeedCard from './cards/RecentActivityFeedCard';
import SeasonalEssentialsCard from './cards/SeasonalEssentialsCard';
import TrustSignalCard from './cards/TrustSignalCard';
import UpcomingAppointmentsCard from './cards/UpcomingAppointmentsCard';
import UpcomingMedicationCard from './cards/UpcomingMedicationCard';
import { FeedAction } from './feed.actions';
import { HomeFeedItem } from './feed.types';

type Props = {
  item: HomeFeedItem;
  onAction?: (action: FeedAction) => void;
};

export default function HomeFeedRenderer({ item, onAction }: Props) {
  const { data: calendarData } = useSelector((state: RootState) => state.calendar);

  if ((item.type as any) === 'GOALS_SECTION') {
    // GoalsCard is built on HealthSection.tsx, which already carries its
    // own marginVertical:16 (top AND bottom) - meant for its other context
    // (the Health tab's own vertical rhythm). Canceling HealthSection's own
    // margins out and reapplying the feed's standard 30px fresh keeps this
    // card visually consistent with the rest of the feed regardless of
    // HealthSection's internals.
    return (
      <View style={{ marginTop: -16, marginBottom: 14 }}>
        <GoalsCard />
      </View>
    );
  }

  switch (item.type) {
    case 'DYNAMIC_HEADER':
      return null;
    case 'UPCOMING_SECTION':
      return (
        <UpcomingSection
          title={item.title}
          appointments={calendarData.appointments}
          medicines={calendarData.medicines}
          onAction={onAction}
          seeAllAction={item.seeAllAction}
        />
      );
    case 'HEALTH_SUMMARY':
      return <HealthSummary title={item.title} />;
    case 'UPCOMING_MEDICATION':
      return <UpcomingMedicationCard data={item} />;
    case 'SEASONAL_ESSENTIALS':
      return <SeasonalEssentialsCard data={item as any} onAction={onAction} />;
    case 'HOME_FEED_FOOTER':
      return <HomeFeedFooter appName={item.appName} tagline={item.tagline} showTrustBadges={item.showTrustBadges} />;
    case 'QUICK_ACTIONS':
      return <QuickActions items={item.items} onAction={onAction!} />;
    case 'SERVICES_SECTION':
      return <ServicesSection title={item.title} services={item.services} layout={item.layout} onAction={onAction!} />;
    case 'HERO_BANNER':
      return <HeroBannerCard data={item as any} onAction={onAction} />;
    case 'UPCOMING_APPOINTMENTS_CARD':
      return <UpcomingAppointmentsCard />;
    case 'CATEGORY_ROW':
      return <CategoryRow title={item.title} items={item.items} onAction={onAction!} />;
    case 'NOT_SERVICEABLE_BANNER':
      return <NotServiceableCard data={item} />;
    case 'PROMO':
      return <PromoCard data={item as any} onAction={onAction} />;
    case 'HEALTH_TIP':
      return <HealthTipCard data={item as any} />;
    case 'PRODUCT_SHOWCASE':
      return <ProductShowcaseCard data={item as any} onAction={onAction} />;
    case 'DOCTOR_RECOMMENDATION':
      return <DoctorRecommendationCard data={item as any} onAction={onAction} />;
    case 'LAB_PACKAGE_SHOWCASE':
      return <LabPackageCard data={item as any} onAction={onAction} />;
    case 'HEALTH_ARTICLE_SHOWCASE':
      return <HealthArticleCard data={item as any} onAction={onAction} />;
    case 'HOSPITAL_SHOWCASE':
      return <HospitalCard data={item as any} onAction={onAction} />;
    case 'HOME_CARE_SHOWCASE':
      return <HomeCareCard data={item as any} onAction={onAction} />;
    case 'CONTINUE_ACTIVITY':
      return <ContinueActivityCard data={item as any} />;
    case 'FAMILY_OVERVIEW':
      return <FamilyOverviewCard data={item as any} onAction={onAction} />;
    case 'RECENT_ACTIVITY':
      return <RecentActivityFeedCard data={item as any} onAction={onAction} />;
    case 'TRUST_SIGNAL':
      return <TrustSignalCard data={item as any} />;
    case 'BLOOD_DONATION_AWARENESS':
      return <BloodDonationAwarenessCard item={item as any} onAction={onAction} />;
    case 'BLOOD_REQUEST_ALERT':
      return <BloodRequestAlertCard item={item as any} onAction={onAction} />;
    default:
      return null;
  }
}
