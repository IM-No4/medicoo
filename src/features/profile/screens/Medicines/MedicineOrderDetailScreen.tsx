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
    XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
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

const formatAmount = (value: any) => {
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export default function MedicineOrderDetailScreen() {
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
        "Error",
        "Could not load order details. Please try again.",
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
      "Cancel Order?",
      "Are you sure you want to cancel this order? This action can only be performed before shipping.",
      async () => {
        hideStatus();
        try {
          await cancelOrder(orderId);
          await fetchDetail();
          showStatus(
            "success",
            "Order Cancelled",
            "Your order has been cancelled successfully.",
          );
        } catch (e: any) {
          showStatus(
            "error",
            "Could Not Cancel",
            e?.response?.data?.message || "This order can no longer be cancelled. Please check its current status.",
          );
        }
      },
      "Confirm Cancellation",
    );
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;

    const htmlContent = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 24px; color: #1F2937; }
                        .header { border-bottom: 2px solid #0FBBA1; padding-bottom: 12px; margin-bottom: 20px; }
                        .title { font-size: 24px; font-weight: bold; color: #0FBBA1; }
                        .order-details { margin-bottom: 20px; font-size: 14px; color: #4B5563; line-height: 1.5; }
                        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .th { border-bottom: 1px solid #D1D5DB; padding: 8px; text-align: left; font-weight: bold; color: #374151; }
                        .td { border-bottom: 1px solid #E5E7EB; padding: 8px; color: #4B5563; }
                        .total-section { margin-top: 20px; text-align: right; font-size: 14px; }
                        .total-row { display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 8px; }
                        .total-label { color: #6B7280; width: 150px; text-align: right; }
                        .total-val { font-weight: bold; color: #1F2937; width: 100px; text-align: right; }
                        .grand-total { font-size: 18px; font-weight: bold; color: #0FBBA1; margin-top: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">MEDICOO INVOICE</div>
                        <div style="margin-top: 4px; color: #6B7280; font-size: 12px;">Thank you for ordering with Medicoo!</div>
                    </div>
                    <div class="order-details">
                        <strong>Order Number:</strong> #${order.orderId.replace("ORD-", "")}<br/>
                        <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}<br/>
                        <strong>Pharmacy:</strong> ${order.pharmacyName}<br/>
                        <strong>Deliver to:</strong><br/>
                        ${order.address?.fullAddress}
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="th">Item Name</th>
                                <th class="th">Brand</th>
                                <th class="th" style="text-align: center;">Qty</th>
                                <th class="th" style="text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items
                              .map(
                                (item: any) => `
                                <tr>
                                    <td class="td">${item.name}</td>
                                    <td class="td">${item.brand}</td>
                                    <td class="td" style="text-align: center;">${item.quantity}</td>
                                    <td class="td" style="text-align: right;">₹${formatAmount(item.price * item.quantity)}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>
                    <div class="total-section">
                        <div class="total-row">
                            <span class="total-label">Subtotal:</span>
                            <span class="total-val">₹${formatAmount(order.billData?.itemsCost ?? order.subtotal)}</span>
                        </div>
                        ${order.billData?.packagingCharges > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Packaging Charges:</span>
                            <span class="total-val">₹${formatAmount(order.billData.packagingCharges)}</span>
                        </div>
                        ` : ""}
                        <div class="total-row">
                            <span class="total-label">Delivery Charges:</span>
                            <span class="total-val">${order.billData ? (order.billData.deliveryCost === 0 ? "FREE" : `₹${formatAmount(order.billData.deliveryCost)}`) : (order.deliveryFee === 0 ? "FREE" : `₹${formatAmount(order.deliveryFee)}`)}</span>
                        </div>
                        ${order.billData?.platformFee > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Platform Fee:</span>
                            <span class="total-val">₹${formatAmount(order.billData.platformFee)}</span>
                        </div>
                        ` : ""}
                        ${order.billData?.couponDiscount > 0 ? `
                        <div class="total-row" style="color: #16A34A;">
                            <span class="total-label">Discount Applied:</span>
                            <span class="total-val">-₹${formatAmount(order.billData.couponDiscount)}</span>
                        </div>
                        ` : ""}
                        ${order.billData?.taxes > 0 ? `
                        <div class="total-row">
                            <span class="total-label">Taxes & Charges:</span>
                            <span class="total-val">₹${formatAmount(order.billData.taxes)}</span>
                        </div>
                        ` : ""}
                        <div class="total-row grand-total">
                            <span class="total-label" style="color: #1F2937;">Total Paid:</span>
                            <span class="total-val">₹${formatAmount(order.total)}</span>
                        </div>
                    </div>
                </body>
            </html>
        `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error("Failed to print PDF:", error);
      showStatus(
        "error",
        "Download Failed",
        "Could not generate invoice PDF. Please try again.",
      );
    }
  };

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
        <ActivityIndicator size="large" color="#0FBBA1" />
      </View>
    );
  }

  const statusLabel = getStatusLabel(order.status);
  const itemsText = `${order.items.length} ${order.items.length === 1 ? "Item" : "Items"}`;
  const totalText = `₹${formatAmount(order.total)}`;

  return (
    <View style={styles.container}>
      {/* Custom Nav Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#1F2937" />
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
          <HelpCircle size={14} color="#4B5563" />
          <Text style={styles.supportBadgeText}>Support</Text>
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
                    color="#0FBBA1"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <Text style={styles.addressSubtext} numberOfLines={1}>
                  {order.deliveryLocation?.address || "Pharmacy Branch"}
                </Text>
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
          <Text style={styles.billDetailsHeading}>BILL DETAILS</Text>

          {/* Items List */}
          <View style={styles.itemsListContainer}>
            {order.items.map((item: any, index: number) => (
              <View key={index} style={styles.billItemRow}>
                <View style={styles.billItemLeft}>
                  <View style={styles.pillIconCircle}>
                    <Pill size={12} color="#0FBBA1" />
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
                        Expiry: {item.expiry || "12/29"}  •  HSN: {item.hsnCode || "3004"}
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
                <Text style={styles.breakdownLabel}>Packaging charges</Text>
                <Text style={styles.breakdownValue}>
                  ₹{formatAmount(order.billData.packagingCharges)}
                </Text>
              </View>
            )}

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Delivery partner fee</Text>
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
                <Text style={styles.breakdownLabel}>Platform fee</Text>
                <Text style={styles.breakdownValue}>
                  ₹{formatAmount(order.billData.platformFee)}
                </Text>
              </View>
            )}

            {order.billData?.couponDiscount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Discount Applied</Text>
                <Text style={[styles.breakdownValue, { color: "#16A34A" }]}>
                  -₹{formatAmount(order.billData.couponDiscount)}
                </Text>
              </View>
            )}

            {order.billData?.taxes > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Taxes & Charges</Text>
                <Text style={styles.breakdownValue}>
                  ₹{formatAmount(order.billData.taxes)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.billDividerLine} />

          {/* Total Row */}
          <View style={styles.billTotalRow}>
            <Text style={styles.billTotalLabel}>Bill Total</Text>
            <Text style={styles.billTotalValue}>₹{formatAmount(order.total)}</Text>
          </View>
        </View>

        {/* Footer/Actions */}
        <View style={styles.footerActionsContainer}>
          {order.status !== "Delivered" && order.status !== "Cancelled" ? (
            <TouchableOpacity
              style={styles.cancelButtonSwiggy}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonTextSwiggy}>Cancel Order</Text>
            </TouchableOpacity>
          ) : null}

          {order.status === "Delivered" ? (
            <TouchableOpacity
              style={styles.downloadInvoiceBtn}
              onPress={handleDownloadInvoice}
            >
              <Download size={14} color="#6B7280" />
              <Text style={styles.downloadInvoiceBtnText}>
                Download Invoice
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FE",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -12,
  },
  headerTitleContainer: {
    marginLeft: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  supportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  supportBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
  },
  content: {
    paddingBottom: 96,
  },
  deliveryPathSection: {
    backgroundColor: "#FFFFFF",
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
    borderColor: "#0FBBA1",
    backgroundColor: "#FFFFFF",
    marginTop: 6,
  },
  lineConnector: {
    width: 1,
    height: 48,
    borderWidth: 1,
    borderColor: "#D1D5DB",
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
    color: "#0FBBA1",
  },
  homeNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  addressSubtext: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 16,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDescriptionText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  loaderSpinner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#0FBBA1",
    borderTopColor: "transparent",
  },
  greyDividerBlock: {
    height: 10,
    backgroundColor: "#F3F4F6",
  },
  billDetailsSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  billDetailsHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
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
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  billItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  itemQtyMultiplier: {
    color: "#4B5563",
    fontWeight: "600",
  },
  billItemBrand: {
    fontSize: 11,
    color: "#6B7280",
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
    color: "#D1D5DB",
    fontSize: 10,
  },
  itemMetaSubText: {
    fontSize: 11,
    color: "#9CA3AF",
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
    color: "#1F2937",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  itemOriginalPriceText: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  billDividerLine: {
    height: 1,
    backgroundColor: "#EEEEEE",
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
    color: "#6B7280",
  },
  breakdownValue: {
    fontSize: 12,
    color: "#1F2937",
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
    color: "#1F2937",
  },
  billTotalValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F2937",
  },
  footerActionsContainer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  reorderButton: {
    backgroundColor: "#0FBBA1",
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
  downloadInvoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 8,
  },
  downloadInvoiceBtnText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "700",
  },
});
