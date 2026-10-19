import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AlertCircle, AtSign, Info, Building2, Check, ChevronDown, ChevronRight, Coins, CreditCard, Plus, Smartphone, Wallet as WalletIcon, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { BANKS, POPULAR_BANK_IDS, WALLETS } from '../banks';
import { CardErrors, CardForm, validateCard } from '../cardUtils';
import { saveLastMethod, SavedChoice } from '../pendingStore';
import type { PaymentConfigState } from '../usePaymentConfig';
import type { Bank, MethodInput, UpiApp, Wallet } from '../types';
import BankSheet from './BankSheet';
import CardFormInline from './CardFormInline';
import { BankLogo, NetworkLogo, UpiAppLogo, WalletLogo } from './BrandIcon';

// The one payment-options list (Swiggy-style): preferred payment first, UPI
// apps, cards, then more options. Gateway-agnostic - it neither knows nor shows
// which gateway will take the payment. The green PAY button sits inside the
// selected option, exactly like Swiggy.

export interface CodOption {
  /** Show a pay-on-delivery row. */
  enabled: boolean;
  busy?: boolean;
  onPlace: () => void;
}

type Selection =
  | { kind: 'upi'; appId: string }
  | { kind: 'upiId' }
  | { kind: 'card' }
  | { kind: 'bank'; bankId: string }
  | { kind: 'wallet'; walletId: string }
  | { kind: 'cod' }
  | null;

/** What the list needs: the config (methods, UPI apps, last choice) and a way to start paying. */
export interface OptionsSource extends Pick<PaymentConfigState, 'config' | 'configError' | 'reloadConfig' | 'upiApps' | 'lastMethod'> {
  phase: 'idle' | string;
  error: { message: string } | null;
  start: (input: MethodInput) => unknown;
  dismissError: () => void;
}

interface Props {
  payment: OptionsSource;
  amountPaise: number;
  cod?: CodOption;
  /** Disable paying online (e.g. maintenance); the reason is shown to the customer. */
  onlineBlockedReason?: string;
}

const formatRupees = (paise: number) => {
  const [whole, dec] = (paise / 100).toFixed(2).split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
};

const emptyCard: CardForm = { number: '', name: '', expiry: '', cvv: '' };

const UPI_ID_PATTERN = /^[\w.+-]{2,256}@[a-zA-Z]{2,64}$/;

export default function PaymentOptionsView({ payment, amountPaise, cod, onlineBlockedReason }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { config, configError, upiApps, lastMethod, phase, error } = payment;

  // What the customer tapped. Until they tap something, the preferred option counts as selected.
  const [picked, setSelection] = useState<Selection>(null);
  // Only one expandable section is open at a time; picking something else closes the previous one.
  const [open, setOpen] = useState<'upiId' | 'card' | 'wallets' | 'banks' | null>(null);
  const upiIdOpen = open === 'upiId';
  const cardOpen = open === 'card';
  const walletsOpen = open === 'wallets';
  const banksOpen = open === 'banks';
  const [vpa, setVpa] = useState('');
  const [vpaError, setVpaError] = useState('');
  const [bankSheet, setBankSheet] = useState(false);
  const [card, setCard] = useState<CardForm>(emptyCard);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const preselected = useRef(false);

  const methods = config?.methods;
  const busy = phase !== 'idle' || Boolean(onlineBlockedReason);
  const walletsEnabled = Boolean(methods?.wallet.enabled);
  const banksEnabled = Boolean(methods?.netbanking.enabled);
  const cardsEnabled = Boolean(methods?.card.enabled);
  const upiEnabled = Boolean(methods?.upi_intent.enabled);
  const upiIdEnabled = Boolean(methods?.upi_collect?.enabled);

  // ---- "Preferred payment": the last method that worked, offered first ----------
  const preferred = useMemo(() => {
    if (!lastMethod) return null;
    if (lastMethod.method === 'upi_intent' && upiEnabled) {
      const app = upiApps.find((a) => a.id === lastMethod.refId);
      return app ? ({ type: 'upi', app } as const) : null;
    }
    if (lastMethod.method === 'upi_collect' && upiIdEnabled) {
      return { type: 'vpa', vpa: lastMethod.refId || lastMethod.label } as const;
    }
    if (lastMethod.method === 'netbanking' && banksEnabled) {
      const bank = BANKS.find((b) => b.id === lastMethod.refId);
      return bank ? ({ type: 'bank', bank } as const) : null;
    }
    if (lastMethod.method === 'wallet' && walletsEnabled) {
      const wallet = WALLETS.find((w) => w.id === lastMethod.refId);
      return wallet ? ({ type: 'wallet', wallet } as const) : null;
    }
    return null;
  }, [lastMethod, upiApps, upiEnabled, upiIdEnabled, banksEnabled, walletsEnabled]);

  // Derived (not set in an effect) so the preferred row always shows its inline PAY button the moment it appears.
  const preferredSelection: Selection = !preferred
    ? null
    : preferred.type === 'vpa'
      ? { kind: 'upiId' }
      : preferred.type === 'upi'
        ? { kind: 'upi', appId: preferred.app.id }
        : preferred.type === 'bank'
          ? { kind: 'bank', bankId: preferred.bank.id }
          : { kind: 'wallet', walletId: preferred.wallet.id };
  const selection: Selection = picked ?? preferredSelection;

  // A preferred UPI ID pre-fills its field.
  useEffect(() => {
    if (preferred?.type === 'vpa' && !vpa) setVpa(preferred.vpa);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferred]);

  // Last time they chose a card: start with the card form open.
  useEffect(() => {
    if (preselected.current || lastMethod?.method !== 'card' || !cardsEnabled) return;
    preselected.current = true;
    setOpen('card');
    setSelection({ kind: 'card' });
  }, [lastMethod, cardsEnabled]);

  // Last time they chose cash on delivery: start with it selected.
  useEffect(() => {
    if (preselected.current || lastMethod?.method !== 'cod' || !cod?.enabled) return;
    preselected.current = true;
    setSelection({ kind: 'cod' });
  }, [lastMethod, cod?.enabled]);

  // ---- actions ---------------------------------------------------------------------
  const payUpi = (app: UpiApp) => payment.start({ method: 'upi_intent', app });
  const payVpa = () => {
    const value = vpa.trim();
    if (!UPI_ID_PATTERN.test(value)) {
      setVpaError('Enter a valid UPI ID, like name@bank');
      return;
    }
    setVpaError('');
    payment.start({ method: 'upi_collect', vpa: value });
  };
  const payBank = (bank: Bank) => payment.start({ method: 'netbanking', bank });
  const payWallet = (wallet: Wallet) => payment.start({ method: 'wallet', wallet });
  const payCard = () => {
    const errors = validateCard(card);
    setCardErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const [mm, yy] = card.expiry.split('/');
    payment.start({ method: 'card', number: card.number, name: card.name, expiryMonth: mm, expiryYear: yy, cvv: card.cvv });
    setCard((c) => ({ ...c, cvv: '' })); // never keep the CVV around
  };

  // `group` is the expandable list the choice lives in (kept open); anything else closes all sections.
  const select = (next: Selection, group: 'upiId' | 'card' | 'wallets' | 'banks' | null = null) => {
    if (busy) return;
    payment.dismissError();
    setSelection(next);
    setOpen(group);
    rememberSelection(next);
  };

  // Choosing an option is enough to remember it: the cart then shows it ("Pay using PhonePe") even if
  // the customer goes back without paying yet.
  const rememberSelection = (next: Selection) => {
    let choice: SavedChoice | null = null;
    if (next?.kind === 'upi') {
      const app = upiApps.find((a) => a.id === next.appId);
      if (app) choice = { method: 'upi_intent', refId: app.id, label: app.name, sub: 'UPI' };
    } else if (next?.kind === 'bank') {
      const bank = BANKS.find((b) => b.id === next.bankId);
      if (bank) choice = { method: 'netbanking', refId: bank.id, label: bank.name, sub: 'Netbanking' };
    } else if (next?.kind === 'wallet') {
      const wallet = WALLETS.find((w) => w.id === next.walletId);
      if (wallet) choice = { method: 'wallet', refId: wallet.id, label: wallet.name, sub: 'Wallet' };
    } else if (next?.kind === 'card') {
      choice = { method: 'card', label: 'Credit / Debit card', sub: 'Card' };
    } else if (next?.kind === 'cod') {
      choice = { method: 'cod', label: 'Cash on delivery', sub: 'Pay on delivery' };
    }
    if (choice) saveLastMethod(choice);
  };

  // ---- pieces ------------------------------------------------------------------------
  const Radio = ({ on }: { on: boolean }) => (
    <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
  );

  const PayButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={[styles.payBtn, busy && styles.payBtnDisabled]} onPress={onPress} disabled={busy} activeOpacity={0.85}>
      {phase === 'creating_attempt' || phase === 'awaiting_user' ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.payBtnText}>{label}</Text>
      )}
    </TouchableOpacity>
  );

  const awaitingHint = phase === 'awaiting_user' ? <Text style={styles.hint}>Complete the payment in the window that opened…</Text> : null;

  const UpiRow = ({ app, last }: { app: UpiApp; last?: boolean }) => {
    const on = selection?.kind === 'upi' && selection.appId === app.id;
    return (
      <View style={[!last && styles.divider]}>
        <TouchableOpacity style={styles.row} onPress={() => select({ kind: 'upi', appId: app.id })} activeOpacity={0.7}>
          <UpiAppLogo app={app} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{app.name}</Text>
            <Text style={styles.rowSub}>UPI</Text>
          </View>
          <Radio on={on} />
        </TouchableOpacity>
        {on && (
          <View style={styles.actionWrap}>
            <PayButton label={`PAY ₹${formatRupees(amountPaise)}`} onPress={() => payUpi(app)} />
            {awaitingHint}
          </View>
        )}
      </View>
    );
  };

  const BankRow = ({ bank }: { bank: Bank }) => {
    const on = selection?.kind === 'bank' && selection.bankId === bank.id;
    return (
      <View>
        <TouchableOpacity style={styles.row} onPress={() => select({ kind: 'bank', bankId: bank.id }, bankGroup(bank.id))} activeOpacity={0.7}>
          <BankLogo bank={bank} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{bank.name}</Text>
            <Text style={styles.rowSub}>Netbanking</Text>
          </View>
          <Radio on={on} />
        </TouchableOpacity>
        {on && (
          <View style={styles.actionWrap}>
            <PayButton label={`PAY ₹${formatRupees(amountPaise)}`} onPress={() => payBank(bank)} />
            {awaitingHint}
          </View>
        )}
      </View>
    );
  };

  const WalletRow = ({ wallet }: { wallet: Wallet }) => {
    const on = selection?.kind === 'wallet' && selection.walletId === wallet.id;
    return (
      <View>
        <TouchableOpacity style={styles.row} onPress={() => select({ kind: 'wallet', walletId: wallet.id }, walletGroup(wallet.id))} activeOpacity={0.7}>
          <WalletLogo wallet={wallet} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{wallet.name}</Text>
            <Text style={styles.rowSub}>Wallet</Text>
          </View>
          <Radio on={on} />
        </TouchableOpacity>
        {on && (
          <View style={styles.actionWrap}>
            <PayButton label={`PAY ₹${formatRupees(amountPaise)}`} onPress={() => payWallet(wallet)} />
            {awaitingHint}
          </View>
        )}
      </View>
    );
  };

  // A bank/wallet picked from the "Preferred" card must not pop open the netbanking/wallet list.
  const bankGroup = (id: string) => (preferred?.type === 'bank' && preferred.bank.id === id ? null : 'banks');
  const walletGroup = (id: string) => (preferred?.type === 'wallet' && preferred.wallet.id === id ? null : 'wallets');

  const popularBanks = POPULAR_BANK_IDS.map((id) => BANKS.find((b) => b.id === id)).filter(Boolean) as Bank[];
  const upiList = preferred?.type === 'upi' ? upiApps.filter((a) => a.id !== preferred.app.id) : upiApps;

  // ---- loading / failure to load -------------------------------------------------
  if (configError) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={28} color={theme.textMuted} />
        <Text style={styles.centeredText}>We could not load payment options.</Text>
        <TouchableOpacity style={styles.retry} onPress={payment.reloadConfig} activeOpacity={0.8}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!config) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#10B981" />
      </View>
    );
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}>
        {!!onlineBlockedReason && (
          <View style={styles.notice}>
            <Info size={16} color={theme.textSecondary} />
            <Text style={styles.noticeText}>{onlineBlockedReason}</Text>
          </View>
        )}

        {/* Preferred payment */}
        {preferred && (
          <>
            <Text style={styles.sectionTitle}>Preferred payment</Text>
            <View style={styles.card}>
              {preferred.type === 'upi' && <UpiRow app={preferred.app} last />}
              {preferred.type === 'vpa' && (
                <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => select({ kind: 'upiId' })}>
                  <View style={styles.iconTile}>
                    <AtSign size={18} color="#7C3AED" />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{preferred.vpa}</Text>
                    <Text style={styles.rowSub}>UPI ID</Text>
                  </View>
                  <Radio on={selection?.kind === 'upiId'} />
                </TouchableOpacity>
              )}
              {preferred.type === 'vpa' && selection?.kind === 'upiId' && (
                <View style={styles.actionWrap}>
                  <PayButton label={`PAY ₹${formatRupees(amountPaise)}`} onPress={payVpa} />
                  {awaitingHint}
                </View>
              )}
              {preferred.type === 'bank' && <BankRow bank={preferred.bank} />}
              {preferred.type === 'wallet' && <WalletRow wallet={preferred.wallet} />}
            </View>
          </>
        )}

        {/* UPI */}
        {(upiEnabled || upiIdEnabled) && (
          <>
            <Text style={styles.sectionTitle}>Pay by any UPI app</Text>
            <View style={styles.card}>
              {upiEnabled &&
                (upiList.length > 0 ? (
                  <View>
                    {upiList.map((app, i) => (
                      <UpiRow key={app.id} app={app} last={i === upiList.length - 1} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.row}>
                    <Smartphone size={18} color={theme.textMuted} />
                    <Text style={[styles.rowSub, styles.rowSubFlex]}>
                      {preferred?.type === 'upi' ? 'That is your only UPI app.' : 'No UPI app found on this phone. Enter a UPI ID, or use a card or netbanking.'}
                    </Text>
                  </View>
                ))}

              {upiIdEnabled && (
                <View style={upiEnabled && styles.dividerTop}>
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (busy) return;
                      payment.dismissError();
                      const next = !upiIdOpen;
                      setOpen(next ? 'upiId' : null);
                      setSelection(next ? { kind: 'upiId' } : null);
                    }}
                  >
                    <View style={styles.iconTile}>
                      <AtSign size={18} color="#7C3AED" />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>Add new UPI ID</Text>
                      <Text style={styles.rowSub}>Approve the request in your UPI app</Text>
                    </View>
                    {upiIdOpen ? <ChevronDown size={18} color={theme.textSecondary} /> : <Plus size={18} color={theme.textSecondary} />}
                  </TouchableOpacity>
                  {upiIdOpen && (
                    <View style={styles.actionWrap}>
                      <TextInput
                        style={[styles.vpaInput, !!vpaError && styles.vpaInputError]}
                        placeholder="yourname@bank"
                        placeholderTextColor={theme.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        value={vpa}
                        editable={!busy}
                        onChangeText={(t) => {
                          setVpa(t);
                          if (vpaError) setVpaError('');
                        }}
                        onSubmitEditing={payVpa}
                      />
                      {!!vpaError && <Text style={styles.vpaError}>{vpaError}</Text>}
                      <View style={{ height: 12 }} />
                      <PayButton label={`PAY ₹${formatRupees(amountPaise)}`} onPress={payVpa} />
                      {phase === 'awaiting_user' && <Text style={styles.hint}>Approve the payment request in your UPI app…</Text>}
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {/* Cards */}
        {cardsEnabled && (
          <>
            <Text style={styles.sectionTitle}>Credit & Debit cards</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => {
                  if (busy) return;
                  payment.dismissError();
                  const next = !cardOpen;
                  setOpen(next ? 'card' : null);
                  setSelection(next ? { kind: 'card' } : null);
                  if (next) rememberSelection({ kind: 'card' });
                }}
              >
                <View style={styles.iconTile}>
                  <CreditCard size={18} color="#EA580C" />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Add new card</Text>
                  <View style={styles.networkRow}>
                    <NetworkLogo network="visa" height={11} />
                    <NetworkLogo network="mastercard" height={14} />
                    <NetworkLogo network="rupay" height={11} />
                    <NetworkLogo network="amex" height={14} />
                  </View>
                </View>
                {cardOpen ? <ChevronDown size={18} color={theme.textSecondary} /> : <Plus size={18} color={theme.textSecondary} />}
              </TouchableOpacity>
              {cardOpen && (
                <View style={styles.actionWrap}>
                  <CardFormInline value={card} errors={cardErrors} disabled={busy} onChange={(next) => setCard(next)} />
                  <View style={{ height: 12 }} />
                  <PayButton label={`PAY ₹${formatRupees(amountPaise)}`} onPress={payCard} />
                  {awaitingHint}
                </View>
              )}
            </View>
          </>
        )}

        {/* More */}
        {(walletsEnabled || banksEnabled) && (
          <>
            <Text style={styles.sectionTitle}>More payment options</Text>
            <View style={styles.card}>
              {walletsEnabled && (
                <View style={[banksEnabled && styles.divider]}>
                  <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => {
                    if (busy) return;
                    setOpen(walletsOpen ? null : 'wallets');
                    setSelection(null);
                  }}>
                    <View style={styles.iconTile}>
                      <WalletIcon size={18} color={theme.textSecondary} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>Wallets</Text>
                      <Text style={styles.rowSub}>Paytm, PhonePe, Amazon Pay & more</Text>
                    </View>
                    {walletsOpen ? <ChevronDown size={18} color={theme.textSecondary} /> : <ChevronRight size={18} color={theme.textSecondary} />}
                  </TouchableOpacity>
                  {walletsOpen && <View style={styles.nested}>{WALLETS.map((w) => <WalletRow key={w.id} wallet={w} />)}</View>}
                </View>
              )}
              {banksEnabled && (
                <View>
                  <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => {
                    if (busy) return;
                    setOpen(banksOpen ? null : 'banks');
                    setSelection(null);
                  }}>
                    <View style={styles.iconTile}>
                      <Building2 size={18} color={theme.textSecondary} />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>Netbanking</Text>
                      <Text style={styles.rowSub}>Select from a list of banks</Text>
                    </View>
                    {banksOpen ? <ChevronDown size={18} color={theme.textSecondary} /> : <ChevronRight size={18} color={theme.textSecondary} />}
                  </TouchableOpacity>
                  {banksOpen && (
                    <View style={styles.nested}>
                      {popularBanks.map((b) => <BankRow key={b.id} bank={b} />)}
                      <TouchableOpacity style={styles.allBanks} onPress={() => setBankSheet(true)} activeOpacity={0.7}>
                        <Text style={styles.allBanksText}>View all banks</Text>
                        <ChevronRight size={16} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}

        {/* Cash on delivery */}
        {cod?.enabled && (
          <>
            <Text style={styles.sectionTitle}>Pay on delivery</Text>
            <View style={styles.card}>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => select({ kind: 'cod' })}>
                <View style={styles.iconTile}>
                  <Coins size={18} color={theme.textSecondary} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>Cash on delivery</Text>
                  <Text style={styles.rowSub}>Pay cash or UPI when your order arrives</Text>
                </View>
                <Radio on={selection?.kind === 'cod'} />
              </TouchableOpacity>
              {selection?.kind === 'cod' && (
                <View style={styles.actionWrap}>
                  <TouchableOpacity style={[styles.payBtn, (cod.busy || busy) && styles.payBtnDisabled]} onPress={cod.onPlace} disabled={cod.busy || busy} activeOpacity={0.85}>
                    {cod.busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.payBtnText}>PLACE ORDER</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        <Text style={styles.secure}>100% secure payments</Text>
      </ScrollView>

      <BankSheet visible={bankSheet} onClose={() => setBankSheet(false)} onSelect={(bank) => {
          setSelection({ kind: 'bank', bankId: bank.id });
          setOpen('banks');
        }} />
    </>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: { paddingHorizontal: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    centeredText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: c.cardSecondary },
    retryText: { fontSize: 14, fontWeight: '700', color: c.text },
    notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.cardSecondary, borderRadius: 12, padding: 12, marginTop: 12 },
    noticeText: { flex: 1, fontSize: 13, fontWeight: '600', color: c.textSecondary },
    banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.errorBg, borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginTop: 12 },
    bannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: c.error },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginTop: 20, marginBottom: 10 },
    card: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.borderLight, overflow: 'hidden' },
    divider: { borderBottomWidth: 1, borderBottomColor: c.borderLight },
    dividerTop: { borderTopWidth: 1, borderTopColor: c.borderLight },
    rowSubFlex: { flex: 1, marginTop: 0 },
    tileWrap: { paddingTop: 14, paddingBottom: 4 },
    tileGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 6 },
    tileCell: { width: '25%', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 2 },
    tile: { width: 58, height: 58, borderRadius: 16, borderWidth: 1.5, borderColor: c.borderLight, backgroundColor: c.cardSecondary, alignItems: 'center', justifyContent: 'center' },
    tileOn: { borderColor: '#10B981', backgroundColor: c.successBg },
    tileTick: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.card },
    tileName: { marginTop: 6, fontSize: 11.5, fontWeight: '600', color: c.textSecondary, textAlign: 'center' },
    tileNameOn: { color: c.text },
    tileAction: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14 },
    vpaInput: { height: 48, borderRadius: 10, borderWidth: 1, borderColor: c.inputBorder, backgroundColor: c.inputBg, paddingHorizontal: 12, fontSize: 15, color: c.text },
    vpaInputError: { borderColor: c.error },
    vpaError: { fontSize: 12, color: c.error, marginTop: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '600', color: c.text },
    rowSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    iconTile: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.cardSecondary, alignItems: 'center', justifyContent: 'center' },
    bankBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: c.cardSecondary, alignItems: 'center', justifyContent: 'center' },
    bankBadgeText: { fontSize: 15, fontWeight: '800', color: c.textSecondary },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    radioOn: { borderColor: '#10B981' },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
    actionWrap: { paddingHorizontal: 14, paddingBottom: 14 },
    payBtn: { height: 48, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    payBtnDisabled: { opacity: 0.6 },
    payBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
    hint: { fontSize: 12, color: c.textSecondary, textAlign: 'center', marginTop: 8 },
    nested: { borderTopWidth: 1, borderTopColor: c.borderLight, backgroundColor: c.background },
    allBanks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 14 },
    allBanksText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
    secure: { textAlign: 'center', fontSize: 12, lineHeight: 20, fontWeight: '600', color: c.textMuted, marginTop: 28, paddingVertical: 8 },
    networkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  });
