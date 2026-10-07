import { LinkingOptions } from '@react-navigation/native';
import { WEB_APP_URL } from '../config/env';

export const linking: LinkingOptions<any> = {
  prefixes: ['medicoo://', WEB_APP_URL],
  config: {
    screens: {
      Tabs: {
        screens: {
          Home: 'home',
        },
      },

      SearchStack: {
        screens: {
          SearchHome: 'search',
        },
      },

      DoctorStack: {
        screens: {
          DoctorDetail: 'doctor/:id',
        },
      },

      PharmacyStack: {
        screens: {
          MedicineDetail: 'medicine/:id',
          PharmacyDetail: 'pharmacy/:id',
        },
      },

      LabStack: {
        screens: {
          LabTestDetail: 'lab-test/:id',
        },
      },

      // Lets a CustomerNotification's actionUrl (Linking.openURL) route
      // back in-app instead of only working from a live push tap's
      // pushNotifications.ts routing - the same request needs to stay
      // actionable from the Notifications feed later too.
      FamilyMembersModal: 'family-requests',
      Friends: 'friend-requests',
    },
  },
};
