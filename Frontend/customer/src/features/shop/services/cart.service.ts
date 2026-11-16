import { apiFetch } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ApiSuccess } from "@/features/auth/types";
import type { Cart } from "@/features/shop/types";

export async function getCart() {
  return apiFetch<ApiSuccess<Cart>>(
    API_ENDPOINTS.cart.root,
    { method: "GET" },
    { auth: true }
  );
}

export async function addCartItem(input: {
  productId: string;
  variantId?: string | null;
  quantity: number;
}) {
  return apiFetch<ApiSuccess<Cart>>(
    API_ENDPOINTS.cart.items,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    { auth: true }
  );
}

export async function setCartItemQuantity(
  productId: string,
  quantity: number,
  variantId?: string | null
) {
  return apiFetch<ApiSuccess<Cart>>(
    API_ENDPOINTS.cart.item(productId),
    {
      method: "PATCH",
      body: JSON.stringify({ quantity, variantId: variantId ?? null }),
    },
    { auth: true }
  );
}

export async function removeCartItem(
  productId: string,
  variantId?: string | null
) {
  const qs =
    variantId != null
      ? `?variantId=${encodeURIComponent(variantId)}`
      : "";
  return apiFetch<ApiSuccess<Cart>>(
    `${API_ENDPOINTS.cart.item(productId)}${qs}`,
    { method: "DELETE" },
    { auth: true }
  );
}

export async function clearCart() {
  return apiFetch<ApiSuccess<Cart>>(
    API_ENDPOINTS.cart.root,
    { method: "DELETE" },
    { auth: true }
  );
}
