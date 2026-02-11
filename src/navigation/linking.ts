import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['medicoo://', 'https://medicoo.app'],
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
