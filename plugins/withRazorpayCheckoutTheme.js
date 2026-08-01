const { withAndroidManifest, withAndroidStyles } = require('expo/config-plugins');

// Razorpay's CheckoutActivity is a native Android activity that ships with
// its own default theme (dark status bar, light nav bar), so it ignores the
// JS <StatusBar> component entirely and looks mismatched against the app's
// UI. This plugin gives it its own theme: status bar background matching
// the checkout's green header (theme.color passed to RazorpayCheckout.open())
// and a light/white nav bar with dark icons.
const RAZORPAY_THEME_NAME = 'RazorpayCheckoutTheme';
const RAZORPAY_HEADER_COLOR = '#2FA561';

const withRazorpayCheckoutStyles = (config) => {
    return withAndroidStyles(config, (config) => {
        const styles = config.modResults;
        const existing = styles.resources.style?.find((s) => s.$.name === RAZORPAY_THEME_NAME);
        if (!existing) {
            if (!styles.resources.style) {
                styles.resources.style = [];
            }
            styles.resources.style.push({
                $: { name: RAZORPAY_THEME_NAME, parent: 'Theme.AppCompat.DayNight.NoActionBar' },
                item: [
                    { $: { name: 'android:statusBarColor' }, _: RAZORPAY_HEADER_COLOR },
                    { $: { name: 'android:navigationBarColor' }, _: '#FFFFFF' },
                    { $: { name: 'android:windowLightNavigationBar', 'tools:targetApi': '27' }, _: 'true' },
                ],
            });
        }
        return config;
    });
};

const withRazorpayCheckoutManifest = (config) => {
    return withAndroidManifest(config, (config) => {
        const application = config.modResults.manifest.application?.[0];
        if (!application) {
            return config;
        }
        if (!application.activity) {
            application.activity = [];
        }
        const existing = application.activity.find(
            (a) => a.$['android:name'] === 'com.razorpay.CheckoutActivity'
        );
        if (existing) {
            existing.$['android:theme'] = `@style/${RAZORPAY_THEME_NAME}`;
            existing.$['tools:replace'] = 'android:theme';
        } else {
            // com.razorpay:standard-core's own manifest already declares this
            // activity with android:theme="@style/CheckoutTheme" - the merger
            // treats that as a conflict unless we explicitly claim the right
            // to replace it.
            application.activity.push({
                $: {
                    'android:name': 'com.razorpay.CheckoutActivity',
                    'android:theme': `@style/${RAZORPAY_THEME_NAME}`,
                    'tools:replace': 'android:theme',
                },
            });
        }
        return config;
    });
};

module.exports = function withRazorpayCheckoutTheme(config) {
    config = withRazorpayCheckoutStyles(config);
    config = withRazorpayCheckoutManifest(config);
    return config;
};
