const { expo: baseConfig } = require('./app.json');

module.exports = () => {
  // Build-time only: read into the native manifest, never inlined into the JS bundle.
  // Restrict this key in Google Cloud Console to this app's Android package name (SHA-1)
  // and iOS bundle ID so it's harmless even if extracted from the compiled app.
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY_NATIVE || '';

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
    ios: {
      ...baseConfig.ios,
      config: {
        ...(baseConfig.ios?.config || {}),
        googleMapsApiKey,
      },
    },
  };
};
