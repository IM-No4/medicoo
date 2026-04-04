const { expo: baseConfig } = require('./app.json');

module.exports = () => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...baseConfig,
    android: {
      ...baseConfig.android,
      config: {
        ...(baseConfig.android?.config || {}),
        googleMaps: {
          ...(baseConfig.android?.config?.googleMaps || {}),
          apiKey: googleMapsApiKey,
        },
      },
    },
  };
};
