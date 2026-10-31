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
const { Product } = require('../src/models/Product');
const { ProductVariant } = require('../src/models/ProductVariant');
const { APPLICATION_STATUSES } = require('../src/constants/applicationStatuses');
const { VendorApplication } = require('../src/models/VendorApplication');

describe('Phase 3B Merchant products', () => {
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
    const size = await Attribute.create({
      name: 'Size',
      code: 'size',
      dataType: 'ENUM',
      inputType: 'SELECT',
      options: [
        { value: 's', label: 'S' },
        { value: 'm', label: 'M' },
      ],
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
    await CategoryAttribute.create({
      categoryId: leaf._id,
      attributeId: size._id,
      required: true,
      variantDefining: true,
      displayOrder: 1,
    });
    return { root, leaf, brand, size };
  }

  async function approvedVendor(email = 'seller@emporia.test') {
    const vendor = await createUser({
      email,
      role: ROLES.VENDOR,
      status: STATUSES.ACTIVE,
    });
    await VendorApplication.create({
      userId: vendor._id,
      shopName: 'Shop',
      slug: `shop-${vendor._id}`,
      description: 'A valid shop description for testing purposes.',
      supportEmail: email,
      phone: '+15550100',
      applicationStatus: APPLICATION_STATUSES.APPROVED,
    });
    return vendor;
  }

  it('lets an approved vendor create a draft from form-schema attributes', async () => {
    const admin = await createUser({
      email: 'admin@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf, brand, size } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();

    const schema = await agent()
      .get(`/api/v1/categories/${leaf._id}/form-schema`)
      .expect(200);
    expect(schema.body.data.fields.map((f) => f.code)).toEqual(
      expect.arrayContaining(['brand', 'size'])
    );

    const created = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Classic Tee',
        brand: 'Emporia Basics',
        basePrice: 499,
        attributeValues: [
          { attributeId: String(brand._id), value: 'Emporia Basics' },
          { attributeId: String(size._id), value: 'm' },
        ],
      })
      .expect(201);

    expect(created.body.data.status).toBe('DRAFT');
    expect(created.body.data.categorySchemaVersion).toBe(1);
    expect(created.body.data.attributeValues).toHaveLength(2);
  });

  it('rejects pending and suspended vendors', async () => {
    const admin = await createUser({
      email: 'admin2@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf } = await seedCatalog(admin._id);

    const pending = await createUser({
      email: 'pending@emporia.test',
      role: ROLES.VENDOR,
      status: STATUSES.PENDING,
    });
    await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(pending))
      .send({ categoryId: String(leaf._id), name: 'Nope' })
      .expect(403);

    const suspended = await createUser({
      email: 'suspended@emporia.test',
      role: ROLES.VENDOR,
      status: STATUSES.SUSPENDED,
    });
    await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(suspended))
      .send({ categoryId: String(leaf._id), name: 'Nope' })
      .expect(403);
  });

  it('blocks cross-vendor access', async () => {
    const admin = await createUser({
      email: 'admin3@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf, brand, size } = await seedCatalog(admin._id);
    const a = await approvedVendor('a@emporia.test');
    const b = await approvedVendor('b@emporia.test');

    const created = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(a))
      .send({
        categoryId: String(leaf._id),
        name: 'Owned',
        attributeValues: [
          { code: 'brand', value: 'A' },
          { code: 'size', value: 's' },
        ],
      })
      .expect(201);

    await agent()
      .get(`/api/v1/vendor/products/${created.body.data.id}`)
      .set('Authorization', authHeader(b))
      .expect(404);
  });

  it('rejects invalid enum values and missing required attributes', async () => {
    const admin = await createUser({
      email: 'admin4@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();

    const missing = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Missing attrs',
        attributeValues: [],
      })
      .expect(400);
    expect(missing.body.error.code).toBe('ATTRIBUTE_REQUIRED');

    const badEnum = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Bad enum',
        attributeValues: [
          { code: 'brand', value: 'X' },
          { code: 'size', value: 'xxl' },
        ],
      })
      .expect(400);
    expect(badEnum.body.error.code).toBe('ATTRIBUTE_INVALID');
  });

  it('rejects non-leaf categories', async () => {
    const admin = await createUser({
      email: 'admin5@emporia.test',
      role: ROLES.ADMIN,
    });
    const { root } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();
    const res = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({ categoryId: String(root._id), name: 'Root product' })
      .expect(400);
    expect(res.body.error.code).toBe('CATEGORY_NOT_LEAF');
  });

  it('sets variants with unique SKUs and adjusts stock atomically', async () => {
    const admin = await createUser({
      email: 'admin6@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();

    const created = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Variant Tee',
        attributeValues: [
          { code: 'brand', value: 'V' },
          { code: 'size', value: 'm' },
        ],
      })
      .expect(201);

    const withVariants = await agent()
      .put(`/api/v1/vendor/products/${created.body.data.id}/variants`)
      .set('Authorization', authHeader(vendor))
      .send({
        variants: [
          {
            sku: 'TEE-M',
            options: { size: 'm' },
            price: 499,
            stockQuantity: 5,
          },
          {
            sku: 'TEE-S',
            options: { size: 's' },
            price: 499,
            stockQuantity: 2,
          },
        ],
      })
      .expect(200);

    expect(withVariants.body.data.variants).toHaveLength(2);

    const dup = await agent()
      .put(`/api/v1/vendor/products/${created.body.data.id}/variants`)
      .set('Authorization', authHeader(vendor))
      .send({
        variants: [
          { sku: 'SAME', options: { size: 'm' }, price: 1, stockQuantity: 1 },
          { sku: 'SAME', options: { size: 's' }, price: 1, stockQuantity: 1 },
        ],
      })
      .expect(409);
    expect(dup.body.error.code).toBe('DUPLICATE_SKU');

    const variantId = withVariants.body.data.variants.find(
      (v) => v.sku === 'TEE-M'
    ).id;

    await agent()
      .post(
        `/api/v1/vendor/products/${created.body.data.id}/variants/${variantId}/stock`
      )
      .set('Authorization', authHeader(vendor))
      .send({ delta: -2 })
      .expect(200);

    const oversell = await agent()
      .post(
        `/api/v1/vendor/products/${created.body.data.id}/variants/${variantId}/stock`
      )
      .set('Authorization', authHeader(vendor))
      .send({ delta: -100 })
      .expect(409);
    expect(oversell.body.error.code).toBe('INSUFFICIENT_STOCK');

    const dbVariant = await ProductVariant.findById(variantId);
    expect(dbVariant.stockQuantity).toBe(3);
  });

  it('uploads image, submits for review, and withdraws', async () => {
    const admin = await createUser({
      email: 'admin7@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();

    const created = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Submit Tee',
        basePrice: 299,
        attributeValues: [
          { code: 'brand', value: 'S' },
          { code: 'size', value: 's' },
        ],
      })
      .expect(201);

    const tmp = path.join(os.tmpdir(), `prod-${Date.now()}.png`);
    fs.writeFileSync(
      tmp,
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      )
    );

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

    const withdrawn = await agent()
      .post(`/api/v1/vendor/products/${created.body.data.id}/withdraw`)
      .set('Authorization', authHeader(vendor))
      .expect(200);
    expect(withdrawn.body.data.status).toBe('DRAFT');
  });

  it('rejects forged status on create body', async () => {
    const admin = await createUser({
      email: 'admin8@emporia.test',
      role: ROLES.ADMIN,
    });
    const { leaf } = await seedCatalog(admin._id);
    const vendor = await approvedVendor();
    const res = await agent()
      .post('/api/v1/vendor/products')
      .set('Authorization', authHeader(vendor))
      .send({
        categoryId: String(leaf._id),
        name: 'Forge',
        status: 'APPROVED',
        vendorId: admin._id.toString(),
        attributeValues: [
          { code: 'brand', value: 'X' },
          { code: 'size', value: 's' },
        ],
      })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
