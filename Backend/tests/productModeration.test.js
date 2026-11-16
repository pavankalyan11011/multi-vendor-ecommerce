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
const { Category } = require('../src/models/Category');
const { Attribute } = require('../src/models/Attribute');
const { CategoryAttribute } = require('../src/models/CategoryAttribute');
const { APPLICATION_STATUSES } = require('../src/constants/applicationStatuses');
const { VendorApplication } = require('../src/models/VendorApplication');
const { STATUSES } = require('../src/constants/statuses');

describe('Phase 3C Product moderation', () => {
  beforeAll(async () => {
    await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await clearDb();
  });

  async function seedCatalog(adminId) {
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
    return { leaf };
  }

  async function approvedVendor() {
    const vendor = await createUser({
      email: `vendor-${Date.now()}@emporia.test`,
      role: ROLES.VENDOR,
      status: STATUSES.ACTIVE,
    });
    await VendorApplication.create({
      userId: vendor._id,
      shopName: 'Mod Shop',
      slug: `mod-shop-${vendor._id}`,
      description: 'A valid shop description for testing purposes.',
      supportEmail: vendor.email,
      phone: '+15550100',
      applicationStatus: APPLICATION_STATUSES.APPROVED,
    });
    return vendor;
  }

  function tinyPng() {
    const tmp = path.join(os.tmpdir(), `mod-${Date.now()}.png`);
    fs.writeFileSync(
      tmp,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      )
    );
    return tmp;
  }

  async function submitReadyProduct(vendor, leaf) {
    const created = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Review Tee',
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

    const submitted = await agent()
      .post(`/api/v1/vendor/products/${created.body.data.id}/submit`)
      .set('Authorization', authHeader(vendor))
      .expect(200);
    expect(submitted.body.data.status).toBe('PENDING_REVIEW');
    return created.body.data.id;
  }

  it('admin approves product and exposes public catalog snapshot', async () => {
    const admin = await createUser({
      email: 'mod-admin@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();
    const productId = await submitReadyProduct(vendor, leaf);

    const pending = await agent()
      .get('/api/v1/admin/products?status=PENDING_REVIEW')
      .set('Authorization', authHeader(admin))
      .expect(200);
    expect(pending.body.data.counts.pendingReview).toBeGreaterThanOrEqual(1);

    const approved = await agent()
      .post(`/api/v1/admin/products/${productId}/approve`)
      .set('Authorization', authHeader(admin))
      .expect(200);
    expect(approved.body.data.status).toBe('APPROVED');
    expect(approved.body.data.publishedSnapshot).toBeTruthy();

    const pubList = await agent().get('/api/v1/products').expect(200);
    expect(pubList.body.data.items.some((p) => p.id === productId)).toBe(true);

    const pubOne = await agent().get(`/api/v1/products/${productId}`).expect(200);
    expect(pubOne.body.data.name).toBe('Review Tee');

    const edited = await agent()
      .patch(`/api/v1/vendor/products/${productId}`)
      .set('Authorization', authHeader(vendor))
      .send({ name: 'Review Tee v2' })
      .expect(200);
    expect(edited.body.data.pendingRevision).toBeTruthy();

    const stillPublic = await agent()
      .get(`/api/v1/products/${productId}`)
      .expect(200);
    expect(stillPublic.body.data.name).toBe('Review Tee');

    await agent()
      .post(
        `/api/v1/admin/product-revisions/${edited.body.data.pendingRevision.id}/approve`
      )
      .set('Authorization', authHeader(admin))
      .expect(200);

    const afterRev = await agent()
      .get(`/api/v1/products/${productId}`)
      .expect(200);
    expect(afterRev.body.data.name).toBe('Review Tee v2');
  });

  it('admin rejects product with reason; merchant can resubmit', async () => {
    const admin = await createUser({
      email: 'mod-admin2@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();
    const productId = await submitReadyProduct(vendor, leaf);

    await agent()
      .post(`/api/v1/admin/products/${productId}/reject`)
      .set('Authorization', authHeader(admin))
      .send({ reason: 'Missing care instructions' })
      .expect(200);

    const hidden = await agent().get(`/api/v1/products/${productId}`).expect(404);
    expect(hidden.body.error.code).toBe('PRODUCT_NOT_FOUND');

    await agent()
      .patch(`/api/v1/vendor/products/${productId}`)
      .set('Authorization', authHeader(vendor))
      .send({ description: 'Updated copy with care notes' })
      .expect(200);

    const resubmit = await agent()
      .post(`/api/v1/vendor/products/${productId}/submit`)
      .set('Authorization', authHeader(vendor))
      .expect(200);
    expect(resubmit.body.data.status).toBe('PENDING_REVIEW');
  });
});
