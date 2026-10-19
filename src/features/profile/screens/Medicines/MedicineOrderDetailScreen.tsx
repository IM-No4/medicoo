import { useMemo } from 'react';
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Download,
    HelpCircle,
    Pill,
    Star,
    XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { executeAction } from "../../../../actions/ActionExecutor";
import StatusModal, {
    StatusType,
} from "../../../../components/modals/StatusModal";
import { cancelOrder, getOrderDetail } from "../../../../services/api";
import { apiClient } from "../../../../services/api/client";
import OrderRatingModal from "../../../../components/modals/OrderRatingModal";
import { useTheme } from '../../../../theme/ThemeContext';
import { AdaptiveStatusBar } from '../../../../components/ThemedStatusBar';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

const formatAmount = (value: any) => {
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export default function MedicineOrderDetailScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { orderId } = route.params;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  // Status Modal State
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({
    visible: false,
    type: "idle",
    title: "",
    message: "",
  });

  const showStatus = (
    type: StatusType,
    title: string,
    message: string,
    primaryAction?: () => void,
    primaryActionText?: string,
  ) => {
    setStatus({
      visible: true,
      type,
      title,
      message,
      primaryAction,
      primaryActionText,
    });
  };

  const hideStatus = () => setStatus((prev) => ({ ...prev, visible: false }));

  const fetchDetail = async () => {
    try {
      const data = await getOrderDetail(orderId);
      setOrder(data);
    } catch (error) {
      showStatus(
        "error",
        t('error'),
        t('could_not_load_order_details_please_tr'),
        () => {
          hideStatus();
          navigation.goBack();
        },
        "Go Back"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [orderId]);

  const handleCancel = () => {
    showStatus(
      "warning",
      t('cancel_order_2'),
      t('are_you_sure_you_want_to_cancel_this_o'),
      async () => {
        hideStatus();
        try {
          await cancelOrder(orderId);
          await fetchDetail();
          showStatus(
            "success",
            t('order_cancelled'),
            t('your_order_has_been_cancelled_successf'),
          );
        } catch (e: any) {
          showStatus(
            "error",
            t('could_not_cancel'),
            e?.response?.data?.message || "This order can no longer be cancelled. Please check its current status.",
          );
        }
      },
      "Confirm Cancellation",
    );
  };

  // The invoice is built by the server (batch + expiry of what was actually supplied, seller and company
  // registration details, legal notes) so there is one source of truth; the app only turns it into a PDF.
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const handleDownloadInvoice = async () => {
    if (!order || downloadingInvoice) return;
    setDownloadingInvoice(true);
    try {
      const res = await apiClient.get(`/api/user/orders/${order._id}/invoice`);
      const { uri } = await Print.printToFileAsync({ html: res.data.html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `Invoice ${res.data.invoiceNumber || ""}`.trim() });
      }
    } catch (error: any) {
      console.error("Failed to build invoice:", error);
      showStatus(
        "error",
        t('download_failed'),
        error?.response?.data?.message || t('could_not_generate_invoice_pdf_please'),
      );
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const [ratingVisible, setRatingVisible] = useState(false);


  const getStatusLabel = (statusName: string) => {
    switch (statusName) {
      case "Delivered":
        return "Delivered";
      case "Shipped":
        return "Shipped";
      case "Processing":
        return "Processing";
      case "Placed":
        return "Placed";
      case "Cancelled":
        return "Cancelled";
      default:
        return statusName;
    }
  };

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <AdaptiveStatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const statusLabel = getStatusLabel(order.status);
  const itemsText = `${order.items.length} ${order.items.length === 1 ? "Item" : "Items"}`;
  const totalText = `₹${formatAmount(order.total)}`;

  return (
    <View style={styles.container}>
      <AdaptiveStatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Custom Nav Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              ORDER #{order.orderId.replace("ORD-", "")}
            </Text>
            <Text style={styles.headerSubtitle}>
              {statusLabel} • {itemsText} • {totalText}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("OrderSupport", { orderId: order.orderId, orderStatus: order.status })}
          style={styles.supportBadge}
        >
          <HelpCircle size={14} color={theme.textSecondary} />
          <Text style={styles.supportBadgeText}>Need help?</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Path Section */}
        <View style={styles.deliveryPathSection}>
          <View style={styles.pathRow}>
            {/* Dot column */}
            <View style={styles.dotColumn}>
              <View style={styles.storeDot} />
              <View style={styles.lineConnector} />
              <View style={styles.homeDot} />
            </View>

            {/* Address column */}
            <View style={styles.addressColumn}>
              <TouchableOpacity
                style={styles.addressInfoBlock}
                activeOpacity={0.7}
                onPress={() => {
                  const pharmacyId = order.storeId?._id || order.storeId;
                  if (pharmacyId) {
                    navigation.navigate("PharmacyStack", {
                      screen: "PharmacyDetail",
                      params: { pharmacyId },
                    });
                  }
                }}
              >
                <View style={styles.pharmacyNameRow}>
                  <Text style={styles.storeNameText}>{order.pharmacyName}</Text>
                  <ChevronRight
                    size={14}
                    color="#10B981"
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.addressInfoBlock}>
                <Text style={styles.homeNameText}>
                  {order.address?.label || "Home"}
                </Text>
                <Text style={styles.addressSubtext} numberOfLines={2}>
                  {order.address?.fullAddress}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          {/* Status Message */}
          <View style={styles.statusRow}>
            {order.status === "Delivered" ? (
              <CheckCircle2 size={16} color="#16A34A" />
            ) : order.status === "Cancelled" || order.status === "rejected" ? (
              <XCircle size={16} color="#DC2626" />
            ) : (
              <View style={styles.loaderSpinner} />
            )}
            <Text style={styles.statusDescriptionText}>
              {order.status === "Delivered"
                ? `Order delivered on ${new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                : order.status === "Cancelled" || order.status === "rejected"
                  ? "Order was cancelled"
                  : "Order in progress"}
            </Text>
          </View>
        </View>

        {/* Grey Divider block */}
        <View style={styles.greyDividerBlock} />

        {/* Bill Details Section */}
        <View style={styles.billDetailsSection}>
          <Text style={styles.billDetailsHeading}>{t('bill_details')}</Text>

          {/* Items List */}
          <View style={styles.itemsListContainer}>
            {order.items.map((item: any, index: number) => (
              <View key={index} style={styles.billItemRow}>
                <View style={styles.billItemLeft}>
                  <View style={styles.pillIconCircle}>
                    <Pill size={12} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billItemName}>
                      {item.name}{" "}
                      <Text style={styles.itemQtyMultiplier}>
                        x {item.quantity}
                      </Text>
                    </Text>
                    <View style={styles.brandAndMetaRow}>
                      <Text style={styles.billItemBrand}>{item.brand}</Text>
                      <Text style={styles.bulletSeparator}>•</Text>
                      <Text style={styles.itemMetaSubText}>
                        Expiry: {item.expiry || "Assigned at dispatch"}  •  HSN: {item.hsnCode || "3004"}
                      </Text>
                    </View>
                    {item.discountAmount > 0 && (
                      <Text style={styles.itemDiscountText}>
                        Discount: -₹{formatAmount(item.discountAmount)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.priceContainer}>
                  {item.discountAmount > 0 && (
                    <Text style={styles.itemOriginalPriceText}>
                      ₹{formatAmount((item.price * item.quantity) + item.discountAmount)}
                    </Text>
                  )}
                  <Text style={styles.billItemPrice}>
                    ₹{formatAmount(item.price * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.billDividerLine} />

          {/* Price Breakdown */}
          <View style={styles.breakdownContainer}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Item Total</Text>
              <Text style={styles.breakdownValue}>
                ₹{formatAmount(order.billData?.itemsCost ?? order.subtotal)}
              </Text>
            </View>

            {order.billData?.packagingCharges > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('packaging_charges_2')}</Text>
                <Text style={styles.breakdownValue}>
                  ₹{formatAmount(order.billData.packagingCharges)}
                </Text>
              </View>
            )}

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('delivery_partner_fee_2')}</Text>
              <Text style={styles.breakdownValue}>
                {order.billData
                  ? order.billData.deliveryCost === 0
                    ? "FREE"
                    : `₹${formatAmount(order.billData.deliveryCost)}`
                  : order.deliveryFee === 0
                    ? "FREE"
                    : `₹${formatAmount(order.deliveryFee)}`}
              </Text>
            </View>

            {order.billData?.platformFee > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('platform_fee_2')}</Text>
                <Text style={styles.breakdownValue}>
                  ₹{formatAmount(order.billData.platformFee)}
                </Text>
              </View>
            )}

            {order.billData?.couponDiscount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('discount_applied')}</Text>
                <Text style={[styles.breakdownValue, { color: "#16A34A" }]}>
                  -₹{formatAmount(order.billData.couponDiscount)}
                </Text>
              </View>
            )}

            {order.billData?.taxes > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('taxes_charges')}</Text>
                <Text style={styles.breakdownValue}>
                  ₹{formatAmount(order.billData.taxes)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.billDividerLine} />

          {/* Total Row */}
          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>{t('bill_total')}</Text>
            <Text style={styles.billTotalValue}>₹{formatAmount(order.total)}</Text>
          </View>
        </View>

        {/* Rate: only for a delivered order that still has something unrated */}
        {order.status === "Delivered" && (!order.review?.storeRating || !order.review?.deliveryRating) ? (
          <TouchableOpacity style={styles.rateCard} activeOpacity={0.85} onPress={() => setRatingVisible(true)}>
            <View style={styles.rateCardIcon}>
              <Star size={18} color="#F59E0B" fill="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rateCardTitle}>How was your order?</Text>
              <Text style={styles.rateCardSub}>
                {!order.review?.storeRating && !order.review?.deliveryRating
                  ? "Rate the pharmacy and the delivery"
                  : !order.review?.storeRating
                    ? "Rate the pharmacy"
                    : "Rate the delivery"}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}

        {/* Footer/Actions */}
        <View style={styles.footerActionsContainer}>
          {order.status !== "Delivered" && order.status !== "Cancelled" ? (
            <TouchableOpacity
              style={styles.cancelButtonSwiggy}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonTextSwiggy}>{t('cancel_order')}</Text>
            </TouchableOpacity>
          ) : null}

          {order.status === "Delivered" ? (
            <TouchableOpacity
              style={styles.downloadInvoiceBtn}
              onPress={handleDownloadInvoice}
              disabled={downloadingInvoice}
            >
              {downloadingInvoice ? <ActivityIndicator size="small" color={theme.textSecondary} /> : <Download size={14} color={theme.textSecondary} />}
              <Text style={styles.downloadInvoiceBtnText}>
                {t('download_invoice')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <OrderRatingModal
        visible={ratingVisible}
        onClose={() => setRatingVisible(false)}
        orderId={order._id}
        storeName={order.pharmacyName}
        deliveryMode={order.deliveryMode}
        review={order.review}
        onSaved={(review) => setOrder((prev: any) => (prev ? { ...prev, review } : prev))}
      />

      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={() => {
          hideStatus();
          if (status.type === "success") {
            fetchDetail();
          }
        }}
        primaryAction={status.primaryAction}
        primaryActionText={status.primaryActionText}
        autoCloseDelay={status.type === "success" ? 2000 : undefined}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.card,
  },
  // Same header bar recipe as the Medicine Orders list / Family Members /
  // Address Book screens - white bar + shadow instead of a hard border.
  // The left-aligned title+subtitle+support-badge layout here is
  // intentionally different content, not part of that unification.
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitleContainer: {
    marginLeft: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: c.text,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 1,
  },
  supportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  supportBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.textSecondary,
  },
  content: {
    paddingBottom: 96,
  },
  deliveryPathSection: {
    backgroundColor: c.card,
    padding: 16,
  },
  pathRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dotColumn: {
    alignItems: "center",
    width: 24,
    marginRight: 12,
  },
  storeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: c.card,
    marginTop: 6,
  },
  lineConnector: {
    width: 1,
    height: 48,
    borderWidth: 1,
    borderColor: c.border,
    borderStyle: "dashed",
    marginVertical: 4,
  },
  homeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1F2937",
    marginTop: 6,
  },
  addressColumn: {
    flex: 1,
    gap: 16,
  },
  addressInfoBlock: {
    justifyContent: "center",
  },
  pharmacyNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  storeNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
  },
  homeNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
  },
  addressSubtext: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: c.cardSecondary,
    marginVertical: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDescriptionText: {
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: "500",
  },
  loaderSpinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#10B981",
    borderTopColor: "transparent",
  },
  greyDividerBlock: {
    height: 10,
    backgroundColor: c.cardSecondary,
  },
  billDetailsSection: {
    backgroundColor: c.card,
    padding: 16,
  },
  billDetailsHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: c.textMuted,
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  itemsListContainer: {
    gap: 16,
    marginBottom: 16,
  },
  billItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  billItemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  pillIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  billItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: c.text,
  },
  itemQtyMultiplier: {
    color: c.textSecondary,
    fontWeight: "600",
  },
  billItemBrand: {
    fontSize: 11,
    color: c.textSecondary,
    fontWeight: "600",
  },
  brandAndMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    flexWrap: "wrap",
  },
  bulletSeparator: {
    marginHorizontal: 4,
    color: c.textMuted,
    fontSize: 10,
  },
  itemMetaSubText: {
    fontSize: 11,
    color: c.textMuted,
  },
  itemDiscountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 2,
  },
  billItemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: c.text,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  itemOriginalPriceText: {
    fontSize: 11,
    color: c.textMuted,
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  billDividerLine: {
    height: 1,
    backgroundColor: c.cardSecondary,
    marginVertical: 14,
  },
  breakdownContainer: {
    gap: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    fontSize: 12,
    color: c.textSecondary,
  },
  breakdownValue: {
    fontSize: 12,
    color: c.text,
    fontWeight: "600",
  },
  billTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: c.text,
  },
  billTotalValue: {
    fontSize: 14,
    fontWeight: "800",
    color: c.text,
  },
  footerActionsContainer: {
    backgroundColor: c.card,
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  reorderButton: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reorderButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cancelButtonSwiggy: {
    borderWidth: 1,
    borderColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonTextSwiggy: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
  claimCard: { marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderLight },
  claimTitle: { fontSize: 15, fontWeight: "800", color: c.text },
  claimText: { fontSize: 12, color: c.textSecondary, lineHeight: 17, marginTop: 4 },
  claimItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 8 },
  claimItemName: { flex: 1, fontSize: 13, fontWeight: "700", color: c.text },
  claimItemState: { fontSize: 12, fontWeight: "700" },
  claimButton: { marginTop: 12, height: 44, borderRadius: 10, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  claimButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  claimRequest: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.borderLight },
  claimRequestHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  claimRequestNumber: { fontSize: 13, fontWeight: "800", color: c.text },
  claimRequestStatus: { fontSize: 12, fontWeight: "800" },
  claimRefund: { fontSize: 13, fontWeight: "800", color: c.text, marginTop: 6 },
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  rateCardIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  rateCardTitle: { fontSize: 14, fontWeight: "800", color: c.text },
  rateCardSub: { fontSize: 12, fontWeight: "500", color: c.textSecondary, marginTop: 2 },
  downloadInvoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadInvoiceBtnText: {
    fontSize: 14,
    color: c.text,
    fontWeight: "700",
  },
});
