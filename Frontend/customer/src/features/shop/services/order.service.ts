import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type { Order, Pagination, ShippingAddress } from "@/features/shop/types";
import type { RazorpayCheckoutOptions } from "@/features/shop/lib/razorpay";

export type CheckoutResponse = {
  order: Order;
  razorpay: RazorpayCheckoutOptions | null;
};

export async function checkout(shippingAddress: ShippingAddress) {
  return apiFetch<ApiSuccess<CheckoutResponse>>(
    API_ENDPOINTS.orders.checkout,
    {
      method: "POST",
      body: JSON.stringify({ shippingAddress }),
    },
    { auth: true }
  );
}

export async function createRazorpayPayment(orderId: string) {
  return apiFetch<ApiSuccess<CheckoutResponse>>(
    API_ENDPOINTS.orders.createPayment(orderId),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function verifyRazorpayPayment(
  orderId: string,
  payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }
) {
  return apiFetch<ApiSuccess<Order>>(
    API_ENDPOINTS.orders.verifyPayment(orderId),
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { auth: true }
  );
}

/** Stub pay — only works when Razorpay is not configured / stub mode. */
export async function payOrder(orderId: string) {
  return apiFetch<ApiSuccess<Order>>(
    API_ENDPOINTS.orders.pay(orderId),
    { method: "POST", body: JSON.stringify({}) },
    { auth: true }
  );
}

export async function listMyOrders(params?: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return apiFetch<
    ApiSuccess<{ items: Order[]; pagination: Pagination }>
  >(
    `${API_ENDPOINTS.orders.me}${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    { auth: true }
  );
}

export async function getMyOrder(id: string) {
  return apiFetch<ApiSuccess<Order>>(
    API_ENDPOINTS.orders.mine(id),
    { method: "GET" },
    { auth: true }
  );
}
