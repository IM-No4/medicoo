import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/env';
import { getToken } from '../utils/tokenManagement';
import { store } from '../redux/store';
import { setActiveOrder, updateOrderStatus } from '../redux/slices/orderSlice';

let socket: Socket | null = null;

type ConsultationChatMessagePayload = { requestId: string; message: any };
type ConsultationChatMessageHandler = (payload: ConsultationChatMessagePayload) => void;
const chatMessageHandlers = new Set<ConsultationChatMessageHandler>();

/** Subscribe to real-time consultation chat messages. Returns an unsubscribe function. */
export function onConsultationChatMessage(handler: ConsultationChatMessageHandler) {
  chatMessageHandlers.add(handler);
  return () => {
    chatMessageHandlers.delete(handler);
  };
}

export async function initializeSocket() {
  if (socket?.connected) return;

  try {
    const token = await getToken('access_token');
    if (!token) {
      console.log('[Socket] No token available, skipping connection.');
      return;
    }

    // Connect to the /customer namespace
    socket = io(`${API_BASE_URL}/customer`, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to customer namespace successfully:', socket?.id);
    });

    socket.on('authenticated', (res) => {
      console.log('[Socket] Authenticated:', res.message);
      // Fetch active orders from database only after successful socket authentication
      socket?.emit('getActiveOrders');
    });

    socket.on('activeOrders', (orders: any[]) => {
      console.log('[Socket] Received active orders:', orders);
      if (orders && orders.length > 0) {
        const activeOrder = orders[0]; // grab the most recent active order
        const storeName = activeOrder.storeName || activeOrder.storeId?.storeName || 'Pharmacy';
        
        let resolvedAmount = 0;
        if (activeOrder.billData) {
          try {
            const bd = typeof activeOrder.billData === 'string' ? JSON.parse(activeOrder.billData) : activeOrder.billData;
            resolvedAmount = Number(bd.finalTotal || bd.totalAmount || bd.grandTotal || bd.total || bd.payableAmount || 0);
          } catch (e) {
            console.warn('[Socket] Error parsing billData:', e);
          }
        }
        if (!resolvedAmount) {
          resolvedAmount = Number(activeOrder.amount || 0);
        }

        console.log('[Socket] Resolved amount:', resolvedAmount, 'from billData:', activeOrder.billData);

        // Format to map exactly to ActiveOrder interface in orderSlice.ts
        const formattedOrder = {
          orderId: activeOrder._id,
          orderNumber: activeOrder.orderNumber,
          storeId: activeOrder.storeId?._id || activeOrder.storeId,
          storeName: storeName,
          amount: resolvedAmount,
          address: activeOrder.deliveryAddress || null,
          status: activeOrder.status,
          timestamp: new Date(activeOrder.createdOn || Date.now()).getTime(),
          items: activeOrder.items || [],
          billData: activeOrder.billData || null,
        };
        store.dispatch(setActiveOrder(formattedOrder));
      }
    });

    socket.on('order_status_update', (data: any) => {
      console.log('[Socket] Order status updated:', data);
      if (data && data.status) {
        store.dispatch(updateOrderStatus(data.status));
      }
    });

    socket.on('consultation_chat:new_message', (payload: ConsultationChatMessagePayload) => {
      chatMessageHandlers.forEach((handler) => handler(payload));
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected from customer namespace:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err);
    });

  } catch (error) {
    console.error('[Socket] Failed to initialize socket connection:', error);
  }
}

export function resetSocketState() {
  if (socket) {
    console.log('[Socket] Disconnecting and cleaning up socket...');
    socket.disconnect();
    socket = null;
  }
}
