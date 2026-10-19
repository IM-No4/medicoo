const { withAndroidManifest } = require('expo/config-plugins');

// Android 11+ hides other apps from an app unless it declares them. Both
// payment SDKs (and our own UPI app tiles) need to discover installed UPI
// apps, which they do by resolving a `upi://` VIEW intent - so the manifest
// must declare that intent under <queries>. Done as a config plugin (never by
// hand-editing the generated android/ folder) so it survives every prebuild.
const withUpiAppQueries = (config) =>
  withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.queries = manifest.queries || [];
    if (manifest.queries.length === 0) manifest.queries.push({});
    const queries = manifest.queries[0];
    queries.intent = queries.intent || [];

    // Declare the common UPI apps by package too, so they are listed even on
    // devices/OS versions that are stricter about package visibility.
    queries.package = queries.package || [];
    const UPI_PACKAGES = [
      'com.google.android.apps.nbu.paisa.user', // Google Pay
      'com.phonepe.app', // PhonePe
      'net.one97.paytm', // Paytm
      'com.dreamplug.androidapp', // CRED
      'in.org.npci.upiapp', // BHIM
      'in.amazon.mShop.android.shopping', // Amazon Pay
      'com.mobikwik_new', // MobiKwik
      'com.whatsapp', // WhatsApp Pay
      'com.freecharge.android', // Freecharge
      'com.csam.icici.bank.imobile', // iMobile Pay
      'com.axis.mobile', // Axis Mobile
      'com.sbi.upi', // SBI Pay
      'com.snapwork.hdfc', // HDFC PayZapp
      'money.super.payments', // super.money
      'com.fampay.in', // FamPay
    ];
    UPI_PACKAGES.forEach((name) => {
      if (!queries.package.some((p) => p.$?.['android:name'] === name)) {
        queries.package.push({ $: { 'android:name': name } });
      }
    });

    // URL schemes of the well-known UPI apps, so Linking.canOpenURL can tell which are installed.
    ['tez', 'phonepe', 'paytmmp', 'credpay', 'bhim', 'amazonpay'].forEach((scheme) => {
      const has = queries.intent.some((i) => (i.data || []).some((d) => d.$?.['android:scheme'] === scheme));
      if (!has) {
        queries.intent.push({
          action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
          data: [{ $: { 'android:scheme': scheme } }],
        });
      }
    });

    const alreadyThere = queries.intent.some(
      (i) => (i.data || []).some((d) => d.$?.['android:scheme'] === 'upi')
    );
    if (!alreadyThere) {
      queries.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:scheme': 'upi' } }],
      });
    }
    return config;
  });

module.exports = withUpiAppQueries;
