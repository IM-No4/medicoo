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
    },
  },
};
