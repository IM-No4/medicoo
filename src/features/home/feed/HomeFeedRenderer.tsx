import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import HealthSummary from '../components/HealthSummary';
import { GoalsCard } from '../../health/components/GoalsCard';
import HomeFeedFooter from '../components/HomeFeedFooter';
import QuickActions from '../components/QuickActions';
import ServicesSection from '../components/ServicesSection';
import UpcomingSection from '../components/UpcomingSection';
import BloodDonationAwarenessCard from './cards/BloodDonationAwarenessCard';
import BloodRequestAlertCard from './cards/BloodRequestAlertCard';
import ContinueActivityCard from './cards/ContinueActivityCard';
import DoctorRecommendationCard from './cards/DoctorRecommendationCard';
import FamilyOverviewCard from './cards/FamilyOverviewCard';
import HealthArticleCard from './cards/HealthArticleCard';
import HealthTipCard from './cards/HealthTipCard';
import HomeCareCard from './cards/HomeCareCard';
import HospitalCard from './cards/HospitalCard';
import LabPackageCard from './cards/LabPackageCard';
import ProductShowcaseCard from './cards/ProductShowcaseCard';
import PromoCard from './cards/PromoCard';
import RecentActivityFeedCard from './cards/RecentActivityFeedCard';
import SeasonalEssentialsCard from './cards/SeasonalEssentialsCard';
import TrustSignalCard from './cards/TrustSignalCard';
import UpcomingAppointmentsCard from './cards/UpcomingAppointmentsCard';
import { FeedAction } from './feed.actions';
import { HomeFeedItem } from './feed.types';

type Props = {
  item: HomeFeedItem;
  onAction?: (action: FeedAction) => void;
};

export default function HomeFeedRenderer({ item, onAction }: Props) {
  const { data: calendarData } = useSelector((state: RootState) => state.calendar);

  if ((item.type as any) === 'GOALS_SECTION') {
    return (
      <View style={{ marginBottom: 24 }}>
        <GoalsCard onAddGoal={() => onAction?.({ type: 'NAVIGATE', stack: 'Tabs', screen: 'Health' } as any)} />
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
    case 'SEASONAL_ESSENTIALS':
      return <SeasonalEssentialsCard data={item as any} onAction={onAction} />;
    case 'HOME_FEED_FOOTER':
      return <HomeFeedFooter appName={item.appName} tagline={item.tagline} />;
    case 'QUICK_ACTIONS':
      return <QuickActions items={item.items} onAction={onAction!} />;
    case 'SERVICES_SECTION':
      return <ServicesSection title={item.title} services={item.services} onAction={onAction!} />;
    case 'UPCOMING_APPOINTMENTS_CARD':
      return <UpcomingAppointmentsCard />;
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
