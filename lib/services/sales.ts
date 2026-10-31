"use client";

import type {
  AbandonedCart,
  Customer,
  Discount,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  ReturnRequest,
  ReturnStatus,
  SalesChannel,
  Shipment,
} from "@/lib/types";
import { useDataStore } from "@/lib/store/data-store";
import { MockApiError, simulateLatency } from "./errors";

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  failed: "Failed",
};

export const FULFILLMENT_STATUS_LABELS = {
  unfulfilled: "Unfulfilled",
  partially_fulfilled: "Partially fulfilled",
  fulfilled: "Fulfilled",
  returned: "Returned",
} as const;

export const orderService = {
  async list(): Promise<Order[]> {
    await simulateLatency(120, 120);
    return useDataStore.getState().orders;
  },

  async get(id: string): Promise<Order> {
    await simulateLatency(80, 80);
    const order = useDataStore.getState().orders.find((item) => item.id === id);
    if (!order) throw new MockApiError("Order not found.", "not_found", 404);
    return order;
  },

  async updateStatus(id: string, status: OrderStatus, note?: string): Promise<Order> {
    await simulateLatency();
    const state = useDataStore.getState();
    const order = state.orders.find((item) => item.id === id);
    if (!order) throw new MockApiError("Order not found.", "not_found", 404);
    if (order.status === status) return order;
    if (!ORDER_TRANSITIONS[order.status].includes(status)) {
      throw new MockApiError(
        `An order that is "${ORDER_STATUS_LABELS[order.status]}" cannot move to "${ORDER_STATUS_LABELS[status]}".`,
        "invalid_transition",
        409,
      );
    }

    const now = new Date().toISOString();
    const fulfillmentStatus =
      status === "shipped" || status === "delivered"
        ? "fulfilled"
        : status === "processing"
          ? "partially_fulfilled"
          : status === "cancelled"
            ? order.fulfillmentStatus
            : "unfulfilled";

    // The order status and the payment status are two views of the same
    // event, so moving an order has to move its payment too. Cancelling a
    // captured order refunds it; a never-paid order simply fails.
    const captured = order.paymentStatus === "paid" || order.paymentStatus === "authorized";
    const paymentStatus: PaymentStatus =
      status === "cancelled"
        ? captured
          ? "refunded"
          : order.paymentStatus === "pending"
            ? "failed"
            : order.paymentStatus
        : status === "confirmed" && order.paymentStatus === "pending"
          ? "paid"
          : order.paymentStatus;
    const refundedTotal = status === "cancelled" && captured ? order.total : order.refundedTotal;

    const updated: Order = {
      ...order,
      status,
      fulfillmentStatus,
      paymentStatus,
      refundedTotal,
      updatedAt: now,
      timeline: [
        ...order.timeline,
        {
          id: `evt-${Date.now().toString(36)}`,
          type: "status" as const,
          title: `Status changed to ${ORDER_STATUS_LABELS[status]}`,
          description: note,
          actor: "You (demo)",
          createdAt: now,
        },
        ...(paymentStatus !== order.paymentStatus
          ? [
              {
                id: `evt-${Date.now().toString(36)}-pay`,
                type: "payment" as const,
                title: `Payment ${PAYMENT_STATUS_LABELS[paymentStatus].toLowerCase()}`,
                description:
                  status === "cancelled"
                    ? "The order was cancelled, so the captured amount was refunded."
                    : "Payment state updated with the order status.",
                actor: "You (demo)",
                createdAt: now,
              },
            ]
          : []),
      ],
    };

    // Mirror the change onto the linked transaction so the Payments list and
    // the order detail page never disagree.
    const payment = state.payments.find((item) => item.orderId === id);
    const updatedPayment: Payment | undefined =
      payment && paymentStatus !== payment.status
        ? {
            ...payment,
            status: paymentStatus,
            refunds:
              status === "cancelled" && captured && payment.refunds.length === 0
                ? [
                    ...payment.refunds,
                    {
                      id: `rfd-${Date.now().toString(36)}`,
                      amount: payment.amount,
                      reason: "Order cancelled",
                      reference: `RFD${Math.floor(Math.random() * 900000 + 100000)}`,
                      createdAt: now,
                    },
                  ]
                : payment.refunds,
          }
        : undefined;

    state.patch({
      orders: state.orders.map((item) => (item.id === id ? updated : item)),
      payments: updatedPayment
        ? state.payments.map((item) => (item.id === updatedPayment.id ? updatedPayment : item))
        : state.payments,
    });
    return updated;
  },

  async addTracking(id: string, carrier: string, trackingNumber: string): Promise<Order> {
    await simulateLatency();
    const state = useDataStore.getState();
    const order = state.orders.find((item) => item.id === id);
    if (!order) throw new MockApiError("Order not found.", "not_found", 404);
    if (!trackingNumber.trim()) throw new MockApiError("Tracking number is required.", "validation");

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      carrier,
      trackingNumber: trackingNumber.trim(),
      updatedAt: now,
      timeline: [
        ...order.timeline,
        {
          id: `evt-${Date.now().toString(36)}`,
          type: "fulfillment" as const,
          title: "Tracking details added",
          description: `${carrier} · ${trackingNumber.trim()}`,
          actor: "You (demo)",
          createdAt: now,
        },
      ],
    };
    state.patch({ orders: state.orders.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },

  async addNote(id: string, body: string): Promise<Order> {
    await simulateLatency(120, 80);
    const state = useDataStore.getState();
    const order = state.orders.find((item) => item.id === id);
    if (!order) throw new MockApiError("Order not found.", "not_found", 404);
    if (!body.trim()) throw new MockApiError("Note cannot be empty.", "validation");

    const now = new Date().toISOString();
    const updated: Order = {
      ...order,
      internalNotes: [
        ...order.internalNotes,
        { id: `note-${Date.now().toString(36)}`, body: body.trim(), author: "You (demo)", createdAt: now },
      ],
      updatedAt: now,
      timeline: [
        ...order.timeline,
        {
          id: `evt-${Date.now().toString(36)}`,
          type: "note" as const,
          title: "Internal note added",
          description: body.trim(),
          actor: "You (demo)",
          createdAt: now,
        },
      ],
    };
    state.patch({ orders: state.orders.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },

  async refund(id: string, amount: number, reason: string): Promise<{ order: Order; payment?: Payment }> {
    await simulateLatency(240, 160);
    const state = useDataStore.getState();
    const order = state.orders.find((item) => item.id === id);
    if (!order) throw new MockApiError("Order not found.", "not_found", 404);
    if (order.paymentStatus === "refunded") {
      throw new MockApiError("This order has already been fully refunded.", "conflict", 409);
    }
    const remaining = order.total - order.refundedTotal;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new MockApiError("Refund amount must be greater than zero.", "validation");
    }
    if (amount > remaining) {
      throw new MockApiError(`Refund cannot exceed the remaining balance of ₹${remaining.toLocaleString("en-IN")}.`, "validation");
    }

    const now = new Date().toISOString();
    const refundedTotal = order.refundedTotal + amount;
    const fullyRefunded = refundedTotal >= order.total;

    const updated: Order = {
      ...order,
      refundedTotal,
      paymentStatus: fullyRefunded ? "refunded" : "partially_refunded",
      updatedAt: now,
      timeline: [
        ...order.timeline,
        {
          id: `evt-${Date.now().toString(36)}`,
          type: "refund" as const,
          title: `Demo refund of ₹${amount.toLocaleString("en-IN")} processed`,
          description: reason,
          actor: "You (demo)",
          createdAt: now,
        },
      ],
    };

    const payment = state.payments.find((item) => item.orderId === id);
    const updatedPayment: Payment | undefined = payment
      ? {
          ...payment,
          status: fullyRefunded ? "refunded" : "partially_refunded",
          refunds: [
            ...payment.refunds,
            {
              id: `rfd-${Date.now().toString(36)}`,
              amount,
              reason,
              reference: `RFD${Math.floor(Math.random() * 900000 + 100000)}`,
              createdAt: now,
            },
          ],
        }
      : undefined;

    state.patch({
      orders: state.orders.map((item) => (item.id === id ? updated : item)),
      payments: updatedPayment
        ? state.payments.map((item) => (item.id === updatedPayment.id ? updatedPayment : item))
        : state.payments,
    });
    return { order: updated, payment: updatedPayment };
  },
};

export const customerService = {
  async list(): Promise<Customer[]> {
    await simulateLatency(110, 110);
    return useDataStore.getState().customers;
  },
  async update(id: string, input: Partial<Customer>): Promise<Customer> {
    await simulateLatency();
    const state = useDataStore.getState();
    const customer = state.customers.find((item) => item.id === id);
    if (!customer) throw new MockApiError("Customer not found.", "not_found", 404);
    const updated = { ...customer, ...input };
    state.patch({ customers: state.customers.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async addNote(id: string, note: string): Promise<Customer> {
    return this.update(id, {
      notes: `${useDataStore.getState().customers.find((c) => c.id === id)?.notes ?? ""}${note ? `\n${note}` : ""}`.trim(),
    });
  },
};

export const paymentService = {
  async list(): Promise<Payment[]> {
    await simulateLatency(110, 110);
    return useDataStore.getState().payments;
  },
  async refund(id: string, amount: number, reason: string): Promise<Payment> {
    await simulateLatency();
    const state = useDataStore.getState();
    const payment = state.payments.find((item) => item.id === id);
    if (!payment) throw new MockApiError("Payment not found.", "not_found", 404);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new MockApiError("Refund amount must be greater than zero.", "validation");
    }
    const refunded = payment.refunds.reduce((sum, refund) => sum + refund.amount, 0);
    if (refunded + amount > payment.amount) {
      throw new MockApiError("Refund exceeds the captured amount.", "validation");
    }
    const now = new Date().toISOString();
    const updated: Payment = {
      ...payment,
      status: refunded + amount >= payment.amount ? "refunded" : "partially_refunded",
      refunds: [
        ...payment.refunds,
        {
          id: `rfd-${Date.now().toString(36)}`,
          amount,
          reason,
          reference: `RFD${Math.floor(Math.random() * 900000 + 100000)}`,
          createdAt: now,
        },
      ],
    };

    // The payment is only half of the story: the linked order has to agree with
    // it, otherwise the order detail page, the refunded KPI and the payment
    // ledger show three different answers for the same transaction.
    const order = state.orders.find((item) => item.id === payment.orderId);
    const updatedOrder: Order | undefined = order
      ? {
          ...order,
          refundedTotal: Math.min(order.total, order.refundedTotal + amount),
          paymentStatus:
            order.refundedTotal + amount >= order.total ? "refunded" : "partially_refunded",
          updatedAt: now,
          timeline: [
            ...order.timeline,
            {
              id: `evt-${Date.now().toString(36)}`,
              type: "refund" as const,
              title: `Demo refund of ₹${amount.toLocaleString("en-IN")} processed`,
              description: reason,
              actor: "You (demo)",
              createdAt: now,
            },
          ],
        }
      : undefined;

    state.patch({
      payments: state.payments.map((item) => (item.id === id ? updated : item)),
      orders: updatedOrder
        ? state.orders.map((item) => (item.id === updatedOrder.id ? updatedOrder : item))
        : state.orders,
    });
    return updated;
  },
};

export const shipmentService = {
  async list(): Promise<Shipment[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().shipments;
  },
  async updateStatus(id: string, status: Shipment["status"]): Promise<Shipment> {
    await simulateLatency();
    const state = useDataStore.getState();
    const shipment = state.shipments.find((item) => item.id === id);
    if (!shipment) throw new MockApiError("Shipment not found.", "not_found", 404);
    const updated: Shipment = { ...shipment, status };
    state.patch({ shipments: state.shipments.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
};

export const returnService = {
  async list(): Promise<ReturnRequest[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().returns;
  },
  async updateStatus(id: string, status: ReturnStatus, resolutionNote?: string): Promise<ReturnRequest> {
    await simulateLatency();
    const state = useDataStore.getState();
    const request = state.returns.find((item) => item.id === id);
    if (!request) throw new MockApiError("Return request not found.", "not_found", 404);
    const updated: ReturnRequest = {
      ...request,
      status,
      resolutionNote: resolutionNote ?? request.resolutionNote,
      updatedAt: new Date().toISOString(),
    };
    state.patch({ returns: state.returns.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
};

export const discountService = {
  async list(): Promise<Discount[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().discounts;
  },
  async create(input: Omit<Discount, "id" | "createdAt" | "usedCount">): Promise<Discount> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.code.trim()) throw new MockApiError("Coupon code is required.", "validation");
    if (state.discounts.some((item) => item.code.toLowerCase() === input.code.toLowerCase())) {
      throw new MockApiError(`Coupon "${input.code}" already exists.`, "conflict", 409);
    }
    const discount: Discount = {
      ...input,
      id: `dsc-${Date.now().toString(36)}`,
      usedCount: 0,
      createdAt: new Date().toISOString(),
    };
    state.patch({ discounts: [...state.discounts, discount] });
    return discount;
  },
  async update(id: string, input: Partial<Discount>): Promise<Discount> {
    await simulateLatency();
    const state = useDataStore.getState();
    const existing = state.discounts.find((item) => item.id === id);
    if (!existing) throw new MockApiError("Discount not found.", "not_found", 404);
    const updated = { ...existing, ...input };
    state.patch({ discounts: state.discounts.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    state.patch({ discounts: state.discounts.filter((item) => item.id !== id) });
  },
};

export const abandonedCartService = {
  async list(): Promise<AbandonedCart[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().abandonedCarts;
  },
  async markRecoverySent(id: string): Promise<AbandonedCart> {
    await simulateLatency(200, 120);
    const state = useDataStore.getState();
    const cart = state.abandonedCarts.find((item) => item.id === id);
    if (!cart) throw new MockApiError("Abandoned cart not found.", "not_found", 404);
    const updated: AbandonedCart = { ...cart, recoveryStatus: "recovery_sent" };
    state.patch({ abandonedCarts: state.abandonedCarts.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async markRecovered(id: string): Promise<AbandonedCart> {
    await simulateLatency(200, 120);
    const state = useDataStore.getState();
    const cart = state.abandonedCarts.find((item) => item.id === id);
    if (!cart) throw new MockApiError("Abandoned cart not found.", "not_found", 404);
    const updated: AbandonedCart = {
      ...cart,
      recoveryStatus: "recovered",
      recoveredAt: new Date().toISOString(),
    };
    state.patch({ abandonedCarts: state.abandonedCarts.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
};

export const SALES_CHANNELS: { value: SalesChannel; label: string }[] = [
  { value: "online_store", label: "Online store" },
  { value: "mobile_app", label: "Mobile app" },
  { value: "marketplace", label: "Marketplace" },
  { value: "wholesale", label: "Wholesale" },
  { value: "social", label: "Social" },
];
