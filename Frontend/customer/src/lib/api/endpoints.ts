/**
 * Emporia Shop API paths only (relative to NEXT_PUBLIC_API_BASE_URL).
 * This app does not call vendor or admin routes.
 */
export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    me: "/auth/me",
    logout: "/auth/logout",
    refresh: "/auth/refresh",
  },
  catalog: {
    products: "/products",
    product: (id: string) => `/products/${id}`,
  },
  cart: {
    root: "/cart",
    items: "/cart/items",
    item: (productId: string) => `/cart/items/${productId}`,
  },
  orders: {
    checkout: "/orders/checkout",
    pay: (id: string) => `/orders/${id}/pay`,
    createPayment: (id: string) => `/orders/${id}/payments/razorpay`,
    verifyPayment: (id: string) => `/orders/${id}/payments/verify`,
    me: "/orders/me",
    mine: (id: string) => `/orders/me/${id}`,
  },
} as const;

type AuthPath = (typeof API_ENDPOINTS.auth)[keyof typeof API_ENDPOINTS.auth];
type CatalogStatic = typeof API_ENDPOINTS.catalog.products;
type CatalogDynamic = ReturnType<typeof API_ENDPOINTS.catalog.product>;
type CartPath =
  | typeof API_ENDPOINTS.cart.root
  | typeof API_ENDPOINTS.cart.items
  | ReturnType<typeof API_ENDPOINTS.cart.item>;
type OrderPath =
  | typeof API_ENDPOINTS.orders.checkout
  | typeof API_ENDPOINTS.orders.me
  | ReturnType<typeof API_ENDPOINTS.orders.pay>
  | ReturnType<typeof API_ENDPOINTS.orders.createPayment>
  | ReturnType<typeof API_ENDPOINTS.orders.verifyPayment>
  | ReturnType<typeof API_ENDPOINTS.orders.mine>;

export type ApiEndpointPath =
  | AuthPath
  | CatalogStatic
  | CatalogDynamic
  | CartPath
  | OrderPath;
