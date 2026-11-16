const mongoose = require('mongoose');
const { Cart, toPublicCart } = require('../models/Cart');
const { Product } = require('../models/Product');
const { ProductVariant } = require('../models/ProductVariant');
const { ApiError } = require('../utils/ApiError');
const { PRODUCT_STATUSES, VARIANT_AVAILABILITY } = require('../constants/productStatuses');
const {
  MAX_CART_LINE_QTY,
  MAX_CART_LINES,
} = require('../constants/orderStatuses');

async function getOrCreateCart(customerId) {
  let cart = await Cart.findOne({ customerId });
  if (!cart) {
    cart = await Cart.create({ customerId, items: [] });
  }
  return cart;
}

function optionsLabel(options) {
  if (!options) return '';
  const entries =
    options instanceof Map
      ? [...options.entries()]
      : Object.entries(options || {});
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}

/**
 * Resolve sellable product from APPROVED published snapshot + live stock for variants.
 */
async function resolveSellableLine({ productId, variantId, quantity }) {
  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid productId');
  }
  if (variantId && !mongoose.isValidObjectId(variantId)) {
    throw new ApiError(400, 'INVALID_ID', 'Invalid variantId');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'quantity must be a positive integer');
  }
  if (quantity > MAX_CART_LINE_QTY) {
    throw new ApiError(
      400,
      'QTY_TOO_HIGH',
      `quantity cannot exceed ${MAX_CART_LINE_QTY}`
    );
  }

  const product = await Product.findById(productId);
  if (
    !product ||
    product.status !== PRODUCT_STATUSES.APPROVED ||
    !product.publishedSnapshot
  ) {
    throw new ApiError(
      409,
      'PRODUCT_UNAVAILABLE',
      'Product is not available for purchase'
    );
  }

  const snap = product.publishedSnapshot;
  const snapProduct = snap.product || {};
  const hasVariants = Boolean(
    snapProduct.hasVariants || (snap.variants || []).length > 0
  );

  if (hasVariants) {
    if (!variantId) {
      throw new ApiError(
        400,
        'VARIANT_REQUIRED',
        'This product requires a variantId'
      );
    }
    const snapVariant = (snap.variants || []).find(
      (v) => String(v.id) === String(variantId)
    );
    if (!snapVariant) {
      throw new ApiError(
        409,
        'PRODUCT_UNAVAILABLE',
        'Selected variant is not available'
      );
    }

    const liveVariant = await ProductVariant.findOne({
      _id: variantId,
      productId: product._id,
    });
    if (!liveVariant || liveVariant.availability === VARIANT_AVAILABILITY.DISABLED) {
      throw new ApiError(
        409,
        'PRODUCT_UNAVAILABLE',
        'Selected variant is not available'
      );
    }
    if (liveVariant.stockQuantity < quantity) {
      throw new ApiError(
        409,
        'INSUFFICIENT_STOCK',
        `Only ${liveVariant.stockQuantity} left in stock`
      );
    }

    return {
      productId: product._id,
      variantId: liveVariant._id,
      vendorId: product.vendorId,
      title: snapProduct.name || product.name,
      variantLabel: optionsLabel(liveVariant.options) || snapVariant.sku || '',
      sku: liveVariant.sku,
      unitPrice: Number(snapVariant.price ?? liveVariant.price),
      currency: (snapVariant.currency || snapProduct.currency || 'INR').toUpperCase(),
      tracksStock: true,
    };
  }

  if (variantId) {
    throw new ApiError(
      400,
      'VARIANT_NOT_ALLOWED',
      'This product does not have variants'
    );
  }
  if (snapProduct.basePrice == null && product.basePrice == null) {
    throw new ApiError(
      409,
      'PRODUCT_UNAVAILABLE',
      'Product has no sellable price'
    );
  }

  return {
    productId: product._id,
    variantId: null,
    vendorId: product.vendorId,
    title: snapProduct.name || product.name,
    variantLabel: '',
    sku: '',
    unitPrice: Number(
      snapProduct.basePrice != null ? snapProduct.basePrice : product.basePrice
    ),
    currency: (snapProduct.currency || product.currency || 'INR').toUpperCase(),
    tracksStock: false,
  };
}

function findLineIndex(cart, productId, variantId) {
  return (cart.items || []).findIndex((item) => {
    const sameProduct = String(item.productId) === String(productId);
    const itemVid = item.variantId ? String(item.variantId) : null;
    const wantVid = variantId ? String(variantId) : null;
    return sameProduct && itemVid === wantVid;
  });
}

async function getCart(customerId) {
  const cart = await getOrCreateCart(customerId);
  return toPublicCart(cart);
}

async function upsertCartItem(customerId, { productId, variantId, quantity }) {
  const resolved = await resolveSellableLine({
    productId,
    variantId: variantId || null,
    quantity,
  });
  const cart = await getOrCreateCart(customerId);
  const idx = findLineIndex(cart, resolved.productId, resolved.variantId);

  if (idx >= 0) {
    const nextQty = cart.items[idx].quantity + quantity;
    if (nextQty > MAX_CART_LINE_QTY) {
      throw new ApiError(
        400,
        'QTY_TOO_HIGH',
        `quantity cannot exceed ${MAX_CART_LINE_QTY}`
      );
    }
    // Re-check stock for combined qty
    await resolveSellableLine({
      productId: String(resolved.productId),
      variantId: resolved.variantId ? String(resolved.variantId) : null,
      quantity: nextQty,
    });
    cart.items[idx].quantity = nextQty;
    cart.items[idx].unitPrice = resolved.unitPrice;
    cart.items[idx].title = resolved.title;
    cart.items[idx].variantLabel = resolved.variantLabel;
    cart.items[idx].currency = resolved.currency;
  } else {
    if ((cart.items || []).length >= MAX_CART_LINES) {
      throw new ApiError(400, 'CART_FULL', `Cart cannot exceed ${MAX_CART_LINES} lines`);
    }
    cart.items.push({
      productId: resolved.productId,
      variantId: resolved.variantId,
      vendorId: resolved.vendorId,
      title: resolved.title,
      variantLabel: resolved.variantLabel,
      quantity,
      unitPrice: resolved.unitPrice,
      currency: resolved.currency,
    });
  }

  await cart.save();
  return toPublicCart(cart);
}

async function setCartItemQuantity(customerId, productId, quantity, variantId) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'quantity must be a non-negative integer');
  }
  const cart = await getOrCreateCart(customerId);
  const idx = findLineIndex(cart, productId, variantId || null);
  if (idx < 0) {
    throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found');
  }

  if (quantity === 0) {
    cart.items.splice(idx, 1);
    await cart.save();
    return toPublicCart(cart);
  }

  const resolved = await resolveSellableLine({
    productId,
    variantId: variantId || null,
    quantity,
  });
  cart.items[idx].quantity = quantity;
  cart.items[idx].unitPrice = resolved.unitPrice;
  cart.items[idx].title = resolved.title;
  cart.items[idx].variantLabel = resolved.variantLabel;
  cart.items[idx].currency = resolved.currency;
  await cart.save();
  return toPublicCart(cart);
}

async function removeCartItem(customerId, productId, variantId) {
  const cart = await getOrCreateCart(customerId);
  const idx = findLineIndex(cart, productId, variantId || null);
  if (idx < 0) {
    throw new ApiError(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found');
  }
  cart.items.splice(idx, 1);
  await cart.save();
  return toPublicCart(cart);
}

async function clearCart(customerId) {
  const cart = await getOrCreateCart(customerId);
  cart.items = [];
  await cart.save();
  return toPublicCart(cart);
}

module.exports = {
  getOrCreateCart,
  getCart,
  upsertCartItem,
  setCartItemQuantity,
  removeCartItem,
  clearCart,
  resolveSellableLine,
};
