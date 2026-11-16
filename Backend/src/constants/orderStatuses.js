const ORDER_STATUSES = Object.freeze({
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUSES));

const PAYMENT_STATUSES = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

const PAYMENT_STATUS_VALUES = Object.freeze(Object.values(PAYMENT_STATUSES));

const FULFILLMENT_STATUSES = Object.freeze({
  UNFULFILLED: 'unfulfilled',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

const FULFILLMENT_STATUS_VALUES = Object.freeze(
  Object.values(FULFILLMENT_STATUSES)
);

const MAX_CART_LINE_QTY = 99;
const MAX_CART_LINES = 50;

module.exports = {
  ORDER_STATUSES,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_VALUES,
  FULFILLMENT_STATUSES,
  FULFILLMENT_STATUS_VALUES,
  MAX_CART_LINE_QTY,
  MAX_CART_LINES,
};
