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

type LiveChatMessagePayload = { chatId: string; message: { _id: string; sender: 'user' | 'bot' | 'agent'; text: string; timestamp: string } };
type LiveChatMessageHandler = (payload: LiveChatMessagePayload) => void;
const liveChatMessageHandlers = new Set<LiveChatMessageHandler>();

/** Subscribe to real-time live-chat messages (support executive replies). Returns an unsubscribe function. */
export function onLiveChatMessage(handler: LiveChatMessageHandler) {
  liveChatMessageHandlers.add(handler);
  return () => {
    liveChatMessageHandlers.delete(handler);
  };
}

type LiveChatStatusPayload = { chatId: string; agentName?: string; closedBy?: string };
type LiveChatStatusHandler = (payload: LiveChatStatusPayload) => void;
const liveChatAgentJoinedHandlers = new Set<LiveChatStatusHandler>();
const liveChatClosedHandlers = new Set<LiveChatStatusHandler>();

/** Subscribe to a live chat being claimed by a support executive. Returns an unsubscribe function. */
export function onLiveChatAgentJoined(handler: LiveChatStatusHandler) {
  liveChatAgentJoinedHandlers.add(handler);
  return () => {
    liveChatAgentJoinedHandlers.delete(handler);
  };
}

/** Subscribe to a live chat being closed. Returns an unsubscribe function. */
export function onLiveChatClosed(handler: LiveChatStatusHandler) {
  liveChatClosedHandlers.add(handler);
  return () => {
    liveChatClosedHandlers.delete(handler);
  };
}

/** Send a live chat message over the already-authenticated customer socket. Returns false if not connected. */
export function emitLiveChatMessage(chatId: string, text: string): boolean {
  if (!socket?.connected) return false;
  socket.emit('live_chat:message', { chatId, text });
  return true;
}

type DeliveryLocationPayload = {
  partnerId: string;
  location: { latitude: number; longitude: number; accuracy?: number | null; speed?: number | null; heading?: number | null };
  timestamp: number;
};
type DeliveryLocationHandler = (payload: DeliveryLocationPayload) => void;
const deliveryLocationHandlers = new Set<DeliveryLocationHandler>();

/** Subscribe to a delivery partner's live GPS pings while an order is out for delivery. Returns an unsubscribe function. */
export function onDeliveryLocationUpdate(handler: DeliveryLocationHandler) {
  deliveryLocationHandlers.add(handler);
  return () => {
    deliveryLocationHandlers.delete(handler);
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

    socket.on('live_chat:message', (payload: LiveChatMessagePayload) => {
      liveChatMessageHandlers.forEach((handler) => handler(payload));
    });

    socket.on('live_chat:agent_joined', (payload: LiveChatStatusPayload) => {
      liveChatAgentJoinedHandlers.forEach((handler) => handler(payload));
    });

    socket.on('live_chat:closed', (payload: LiveChatStatusPayload) => {
      liveChatClosedHandlers.forEach((handler) => handler(payload));
    });

    socket.on('delivery_location_update', (payload: DeliveryLocationPayload) => {
      deliveryLocationHandlers.forEach((handler) => handler(payload));
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
