const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  startTestApp,
  stopTestApp,
  clearDb,
  createUser,
  authHeader,
  agent,
} = require('./helpers');
const { ROLES } = require('../src/constants/roles');
const { STATUSES } = require('../src/constants/statuses');
const { Category } = require('../src/models/Category');
const { Attribute } = require('../src/models/Attribute');
const { CategoryAttribute } = require('../src/models/CategoryAttribute');
const { APPLICATION_STATUSES } = require('../src/constants/applicationStatuses');
const { VendorApplication } = require('../src/models/VendorApplication');
const { ProductVariant } = require('../src/models/ProductVariant');

describe('Cart and checkout', () => {
  beforeAll(async () => {
    await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await clearDb();
  });

  async function seedLeaf(adminId) {
    const root = await Category.create({
      name: 'Fashion',
      slug: 'fashion',
      parentId: null,
      ancestors: [],
      level: 0,
      path: '/fashion',
      status: 'ACTIVE',
      sortOrder: 0,
      createdBy: adminId,
      updatedBy: adminId,
      schemaVersion: 1,
    });
    const leaf = await Category.create({
      name: 'T-Shirts',
      slug: 't-shirts',
      parentId: root._id,
      ancestors: [root._id],
      level: 1,
      path: '/fashion/t-shirts',
      status: 'ACTIVE',
      sortOrder: 0,
      createdBy: adminId,
      updatedBy: adminId,
      schemaVersion: 1,
    });
    const brand = await Attribute.create({
      name: 'Brand',
      code: 'brand',
      dataType: 'STRING',
      inputType: 'TEXT',
      status: 'ACTIVE',
      createdBy: adminId,
      updatedBy: adminId,
      schemaVersion: 1,
    });
    await CategoryAttribute.create({
      categoryId: leaf._id,
      attributeId: brand._id,
      required: true,
      displayOrder: 0,
    });
    return leaf;
  }

  async function approvedVendor() {
    const vendor = await createUser({
      email: `v-${Date.now()}@emporia.test`,
      role: ROLES.VENDOR,
      status: STATUSES.ACTIVE,
    });
    await VendorApplication.create({
      userId: vendor._id,
      shopName: 'Cart Shop',
      slug: `cart-shop-${vendor._id}`,
      description: 'A valid shop description for testing purposes.',
      supportEmail: vendor.email,
      phone: '+15550100',
      applicationStatus: APPLICATION_STATUSES.APPROVED,
    });
    return vendor;
  }

  function tinyPng() {
    const tmp = path.join(os.tmpdir(), `cart-${Date.now()}.png`);
    fs.writeFileSync(
      tmp,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      )
    );
    return tmp;
  }

  async function publishSimpleProduct(admin, vendor, leaf) {
    const created = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Cart Tee',
        basePrice: 499,
        attributeValues: [{ code: 'brand', value: 'Emporia' }],
      })
      .expect(201);

    const tmp = tinyPng();
    await agent()
      .post(`/api/v1/vendor/products/${created.body.data.id}/images`)
      .set('Authorization', authHeader(vendor))
      .attach('image', tmp)
      .expect(201);
    fs.unlinkSync(tmp);

    await agent()
      .post(`/api/v1/vendor/products/${created.body.data.id}/submit`)
      .set('Authorization', authHeader(vendor))
      .expect(200);

    await agent()
      .post(`/api/v1/admin/products/${created.body.data.id}/approve`)
      .set('Authorization', authHeader(admin))
      .expect(200);

    return created.body.data.id;
  }

  async function publishVariantProduct(admin, vendor, leaf) {
    const created = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Variant Tee',
        attributeValues: [{ code: 'brand', value: 'Emporia' }],
      })
      .expect(201);

    const variants = await agent()
      .put(`/api/v1/vendor/products/${created.body.data.id}/variants`)
      .set('Authorization', authHeader(vendor))
      .send({
        variants: [
          {
            sku: `SKU-${Date.now()}`,
            options: {},
            price: 399,
            stockQuantity: 5,
          },
        ],
      })
      .expect(200);

    const tmp = tinyPng();
    await agent()
      .post(`/api/v1/vendor/products/${created.body.data.id}/images`)
      .set('Authorization', authHeader(vendor))
      .attach('image', tmp)
      .expect(201);
    fs.unlinkSync(tmp);

    await agent()
      .post(`/api/v1/vendor/products/${created.body.data.id}/submit`)
      .set('Authorization', authHeader(vendor))
      .expect(200);
    await agent()
      .post(`/api/v1/admin/products/${created.body.data.id}/approve`)
      .set('Authorization', authHeader(admin))
      .expect(200);

    return {
      productId: created.body.data.id,
      variantId: variants.body.data.variants[0].id,
    };
  }

  it('adds to cart, checks out, pays, and decrements variant stock', async () => {
    const admin = await createUser({
      email: 'cart-admin@emporia.test',
      role: ROLES.ADMIN,
    });
    const leaf = await seedLeaf(admin._id);
    const vendor = await approvedVendor();
    const customer = await createUser({
      email: 'buyer@emporia.test',
      role: ROLES.CUSTOMER,
      status: STATUSES.ACTIVE,
    });

    const { productId, variantId } = await publishVariantProduct(
      admin,
      vendor,
      leaf
    );

    const cart = await agent()
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader(customer))
      .send({ productId, variantId, quantity: 2 })
      .expect(200);
    expect(cart.body.data.items).toHaveLength(1);
    expect(cart.body.data.subtotal).toBe(798);

    const order = await agent()
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader(customer))
      .send({
        shippingAddress: {
          fullName: 'Buyer One',
          line1: '12 Market Street',
          city: 'Hyderabad',
          state: 'TS',
          postalCode: '500001',
          phone: '+919999999999',
        },
      })
      .expect(201);

    expect(order.body.data.order.status).toBe('pending_payment');
    expect(order.body.data.order.items[0].quantity).toBe(2);

    const empty = await agent()
      .get('/api/v1/cart')
      .set('Authorization', authHeader(customer))
      .expect(200);
    expect(empty.body.data.items).toHaveLength(0);

    const paid = await agent()
      .post(`/api/v1/orders/${order.body.data.order.id}/pay`)
      .set('Authorization', authHeader(customer))
      .expect(200);
    expect(paid.body.data.paymentStatus).toBe('paid');
    expect(paid.body.data.status).toBe('processing');

    const variant = await ProductVariant.findById(variantId);
    expect(variant.stockQuantity).toBe(3);

    const mine = await agent()
      .get('/api/v1/orders/me')
      .set('Authorization', authHeader(customer))
      .expect(200);
    expect(mine.body.data.items).toHaveLength(1);
  });

  it('rejects checkout when cart is empty and blocks unavailable products', async () => {
    const customer = await createUser({
      email: 'buyer2@emporia.test',
      role: ROLES.CUSTOMER,
      status: STATUSES.ACTIVE,
    });

    const empty = await agent()
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader(customer))
      .send({
        shippingAddress: {
          fullName: 'Buyer Two',
          line1: '12 Market Street',
          city: 'Hyderabad',
          state: 'TS',
          postalCode: '500001',
          phone: '+919999999998',
        },
      })
      .expect(400);
    expect(empty.body.error.code).toBe('EMPTY_CART');

    const admin = await createUser({
      email: 'cart-admin2@emporia.test',
      role: ROLES.ADMIN,
    });
    const leaf = await seedLeaf(admin._id);
    const vendor = await approvedVendor();
    const productId = await publishSimpleProduct(admin, vendor, leaf);

    await agent()
      .post('/api/v1/cart/items')
      .set('Authorization', authHeader(customer))
      .send({ productId, quantity: 1 })
      .expect(200);

    const checkout = await agent()
      .post('/api/v1/orders/checkout')
      .set('Authorization', authHeader(customer))
      .send({
        shippingAddress: {
          fullName: 'Buyer Two',
          line1: '12 Market Street',
          city: 'Hyderabad',
          state: 'TS',
          postalCode: '500001',
          phone: '+919999999998',
        },
      })
      .expect(201);
    expect(checkout.body.data.order.total).toBe(499);
  });
});
