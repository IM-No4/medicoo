import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import type { CardNetwork } from '../cardUtils';
import type { Bank, UpiApp, Wallet } from '../types';
import { APP_SVG, BANK_IMAGE, NETWORK_SVG, WALLET_IMAGE } from './brandAssets';

// The real logos of UPI apps, banks, wallets and card networks (bundled in
// brandAssets.ts). Anything without a logo falls back to a coloured initial.

const APP_MATCH: Array<[RegExp, keyof typeof APP_SVG]> = [
  [/google|gpay|tez|nbu\.paisa/i, 'googlepay'],
  [/phonepe/i, 'phonepe'],
  [/paytm/i, 'paytm'],
  [/cred|dreamplug/i, 'cred'],
  [/bhim|npci/i, 'bhim'],
  [/amazon/i, 'amazonpay'],
  [/whatsapp/i, 'whatsapp'],
  [/airtel/i, 'airtel'],
];

const aspectOf = (xml: string): number => {
  const m = /viewBox="([-\d.\s]+)"/.exec(xml);
  if (!m) return 1;
  const [, , w, h] = m[1].trim().split(/\s+/).map(Number);
  return w && h ? w / h : 1;
};

const Initial = ({ label, size, color = '#64748B' }: { label: string; size: number; color?: string }) => (
  <View style={[styles.initial, { width: size, height: size, borderRadius: size / 4, backgroundColor: color }]}>
    <Text style={[styles.initialText, { fontSize: size * 0.45 }]}>{label.trim().charAt(0).toUpperCase()}</Text>
  </View>
);

/** A UPI app: its logo, else the icon the SDK supplied, else an initial. */
export function UpiAppLogo({ app, size = 40 }: { app: Pick<UpiApp, 'name' | 'icon' | 'packageOrScheme'>; size?: number }) {
  const key = APP_MATCH.find(([re]) => re.test(`${app.name} ${app.packageOrScheme}`))?.[1];
  if (key) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 4, overflow: 'hidden' }}>
        <SvgXml xml={APP_SVG[key]} width={size} height={size} />
      </View>
    );
  }
  if (app.icon) return <Image source={{ uri: app.icon }} style={{ width: size, height: size, borderRadius: size / 4 }} resizeMode="contain" />;
  return <Initial label={app.name} size={size} />;
}

const Tile = ({ size, children }: { size: number; children: React.ReactNode }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: theme.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
};

export function BankLogo({ bank, size = 36 }: { bank: Pick<Bank, 'name' | 'razorpay'>; size?: number }) {
  const source = BANK_IMAGE[bank.razorpay];
  if (!source) return <Initial label={bank.name} size={size} />;
  return (
    <Tile size={size}>
      <Image source={source} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" />
    </Tile>
  );
}

export function WalletLogo({ wallet, size = 36 }: { wallet: Pick<Wallet, 'name' | 'razorpay'>; size?: number }) {
  const source = WALLET_IMAGE[wallet.razorpay];
  if (!source) return <Initial label={wallet.name} size={size} />;
  return (
    <Tile size={size}>
      <Image source={source} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" />
    </Tile>
  );
}

/** A card network's logo at a fixed height (width follows the logo's own shape). */
export function NetworkLogo({ network, height = 18 }: { network: CardNetwork | 'maestro'; height?: number }) {
  const xml = NETWORK_SVG[network];
  if (!xml) return null;
  return <SvgXml xml={xml} width={height * aspectOf(xml)} height={height} />;
}

const styles = StyleSheet.create({
  initial: { alignItems: 'center', justifyContent: 'center' },
  initialText: { color: '#FFFFFF', fontWeight: '800' },
});
