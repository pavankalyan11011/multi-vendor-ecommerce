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
const { AuditLog } = require('../src/models/AuditLog');
const { MAX_CATEGORY_DEPTH } = require('../src/constants/categoryStatuses');

describe('Phase 3A Catalog', () => {
  beforeAll(async () => {
    await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await clearDb();
  });

  async function adminAuth() {
    const admin = await createUser({
      email: 'admin@emporia.test',
      role: ROLES.ADMIN,
      status: STATUSES.ACTIVE,
    });
    return { admin, auth: authHeader(admin) };
  }

  it('creates root and nested categories with path/ancestors', async () => {
    const { auth } = await adminAuth();

    const root = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Fashion', slug: 'fashion' })
      .expect(201);

    expect(root.body.data.level).toBe(0);
    expect(root.body.data.path).toBe('/fashion');
    expect(root.body.data.ancestors).toEqual([]);

    const child = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({
        name: "Men's Fashion",
        slug: 'mens',
        parentId: root.body.data.id,
      })
      .expect(201);

    expect(child.body.data.level).toBe(1);
    expect(child.body.data.path).toBe('/fashion/mens');
    expect(child.body.data.ancestors).toEqual([root.body.data.id]);

    const leaf = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({
        name: 'T-Shirts',
        slug: 't-shirts',
        parentId: child.body.data.id,
      })
      .expect(201);

    expect(leaf.body.data.level).toBe(2);
    expect(leaf.body.data.path).toBe('/fashion/mens/t-shirts');
  });

  it('rejects duplicate sibling slugs and depth overflow', async () => {
    const { auth } = await adminAuth();
    const root = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Electronics', slug: 'electronics' })
      .expect(201);

    await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Phones', slug: 'phones', parentId: root.body.data.id })
      .expect(201);

    const dup = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Phones 2', slug: 'phones', parentId: root.body.data.id })
      .expect(409);
    expect(dup.body.error.code).toBe('DUPLICATE_SLUG');

    let parentId = root.body.data.id;
    for (let level = 1; level <= MAX_CATEGORY_DEPTH; level += 1) {
      const res = await agent()
        .post('/api/v1/admin/categories')
        .set('Authorization', auth)
        .send({ name: `L${level}`, slug: `l${level}`, parentId })
        .expect(201);
      parentId = res.body.data.id;
    }

    const overflow = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Too Deep', slug: 'too-deep', parentId })
      .expect(400);
    expect(overflow.body.error.code).toBe('MAX_DEPTH_EXCEEDED');
  });

  it('prevents circular moves into descendants', async () => {
    const { auth } = await adminAuth();
    const a = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Cat A', slug: 'cat-a' })
      .expect(201);
    const b = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Cat B', slug: 'cat-b', parentId: a.body.data.id })
      .expect(201);
    const c = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Cat C', slug: 'cat-c', parentId: b.body.data.id })
      .expect(201);

    const bad = await agent()
      .patch(`/api/v1/admin/categories/${a.body.data.id}/move`)
      .set('Authorization', auth)
      .send({ parentId: c.body.data.id })
      .expect(400);
    expect(bad.body.error.code).toBe('CIRCULAR_REFERENCE');
  });

  it('moves a subtree and rewrites paths', async () => {
    const { auth } = await adminAuth();
    const fashion = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Fashion', slug: 'fashion' })
      .expect(201);
    const electronics = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Electronics', slug: 'electronics' })
      .expect(201);
    const mens = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({
        name: 'Mens',
        slug: 'mens',
        parentId: fashion.body.data.id,
      })
      .expect(201);
    const shirts = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({
        name: 'Shirts',
        slug: 'shirts',
        parentId: mens.body.data.id,
      })
      .expect(201);

    await agent()
      .patch(`/api/v1/admin/categories/${mens.body.data.id}/move`)
      .set('Authorization', auth)
      .send({ parentId: electronics.body.data.id })
      .expect(200);

    const movedMens = await Category.findById(mens.body.data.id);
    const movedShirts = await Category.findById(shirts.body.data.id);
    expect(movedMens.path).toBe('/electronics/mens');
    expect(movedMens.ancestors.map(String)).toEqual([electronics.body.data.id]);
    expect(movedShirts.path).toBe('/electronics/mens/shirts');
    expect(movedShirts.ancestors.map(String)).toEqual([
      electronics.body.data.id,
      mens.body.data.id,
    ]);
  });

  it('hides inactive categories from public discovery', async () => {
    const { auth } = await adminAuth();
    const root = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Beauty', slug: 'beauty' })
      .expect(201);
    const child = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({
        name: 'Skin',
        slug: 'skin',
        parentId: root.body.data.id,
      })
      .expect(201);

    await agent()
      .patch(`/api/v1/admin/categories/${root.body.data.id}/status`)
      .set('Authorization', auth)
      .send({ status: 'INACTIVE' })
      .expect(200);

    await agent().get(`/api/v1/categories/${child.body.data.id}`).expect(404);

    const tree = await agent().get('/api/v1/categories/tree').expect(200);
    expect(tree.body.data).toEqual([]);
  });

  it('creates attributes, assigns to category, builds form-schema with inheritance', async () => {
    const { auth } = await adminAuth();
    const root = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Fashion', slug: 'fashion' })
      .expect(201);
    const leaf = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({
        name: 'Tees',
        slug: 'tees',
        parentId: root.body.data.id,
      })
      .expect(201);

    const brand = await agent()
      .post('/api/v1/admin/attributes')
      .set('Authorization', auth)
      .send({
        name: 'Brand',
        code: 'brand',
        dataType: 'STRING',
        inputType: 'TEXT',
      })
      .expect(201);

    const size = await agent()
      .post('/api/v1/admin/attributes')
      .set('Authorization', auth)
      .send({
        name: 'Size',
        code: 'size',
        dataType: 'ENUM',
        inputType: 'SELECT',
        options: [
          { value: 's', label: 'S' },
          { value: 'm', label: 'M' },
        ],
      })
      .expect(201);

    await agent()
      .put(`/api/v1/admin/categories/${root.body.data.id}/attributes`)
      .set('Authorization', auth)
      .send({
        assignments: [
          {
            attributeId: brand.body.data.id,
            required: true,
            filterable: true,
            displayOrder: 0,
          },
        ],
      })
      .expect(200);

    await agent()
      .put(`/api/v1/admin/categories/${leaf.body.data.id}/attributes`)
      .set('Authorization', auth)
      .send({
        assignments: [
          {
            attributeId: size.body.data.id,
            required: true,
            variantDefining: true,
            displayOrder: 1,
          },
        ],
      })
      .expect(200);

    const schema = await agent()
      .get(`/api/v1/categories/${leaf.body.data.id}/form-schema`)
      .expect(200);

    const codes = schema.body.data.fields.map((f) => f.code);
    expect(codes).toEqual(expect.arrayContaining(['brand', 'size']));
    expect(schema.body.data.fields.find((f) => f.code === 'size').variantDefining).toBe(
      true
    );
  });

  it('rejects duplicate attribute codes and ENUM without options', async () => {
    const { auth } = await adminAuth();
    await agent()
      .post('/api/v1/admin/attributes')
      .set('Authorization', auth)
      .send({
        name: 'Color',
        code: 'color',
        dataType: 'STRING',
        inputType: 'TEXT',
      })
      .expect(201);

    const dup = await agent()
      .post('/api/v1/admin/attributes')
      .set('Authorization', auth)
      .send({
        name: 'Colour',
        code: 'color',
        dataType: 'STRING',
        inputType: 'TEXT',
      })
      .expect(409);
    expect(dup.body.error.code).toBe('DUPLICATE_CODE');

    const bad = await agent()
      .post('/api/v1/admin/attributes')
      .set('Authorization', auth)
      .send({
        name: 'Fit',
        code: 'fit',
        dataType: 'ENUM',
        inputType: 'SELECT',
        options: [],
      })
      .expect(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('blocks vendor and customer from admin catalog mutations', async () => {
    const vendor = await createUser({
      email: 'vendor@emporia.test',
      role: ROLES.VENDOR,
      status: STATUSES.ACTIVE,
    });
    const customer = await createUser({
      email: 'customer@emporia.test',
      role: ROLES.CUSTOMER,
      status: STATUSES.ACTIVE,
    });

    await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', authHeader(vendor))
      .send({ name: 'X', slug: 'x' })
      .expect(403);

    await agent()
      .post('/api/v1/admin/attributes')
      .set('Authorization', authHeader(customer))
      .send({
        name: 'Y',
        code: 'y',
        dataType: 'STRING',
        inputType: 'TEXT',
      })
      .expect(403);
  });

  it('blocks suspended admin from mutations', async () => {
    const admin = await createUser({
      email: 'suspended-admin@emporia.test',
      role: ROLES.ADMIN,
      status: STATUSES.SUSPENDED,
    });
    await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', authHeader(admin))
      .send({ name: 'Nope', slug: 'nope' })
      .expect(403);
  });

  it('reorders siblings and writes audit logs', async () => {
    const { auth, admin } = await adminAuth();
    const a = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Alpha', slug: 'alpha', sortOrder: 0 })
      .expect(201);
    const b = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'Beta', slug: 'beta', sortOrder: 1 })
      .expect(201);

    await agent()
      .patch('/api/v1/admin/categories/reorder')
      .set('Authorization', auth)
      .send({
        parentId: null,
        orderedIds: [b.body.data.id, a.body.data.id],
      })
      .expect(200);

    const refreshedA = await Category.findById(a.body.data.id);
    const refreshedB = await Category.findById(b.body.data.id);
    expect(refreshedB.sortOrder).toBe(0);
    expect(refreshedA.sortOrder).toBe(1);

    const logs = await AuditLog.find({ actorId: admin._id });
    expect(logs.length).toBeGreaterThan(0);
  });

  it('accepts a valid PNG category image upload', async () => {
    const { auth } = await adminAuth();
    const cat = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({ name: 'ImgCat', slug: 'img-cat' })
      .expect(201);

    const tmp = path.join(os.tmpdir(), `cat-${Date.now()}.png`);
    // Minimal 1x1 PNG
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(tmp, png);

    const res = await agent()
      .post(`/api/v1/admin/categories/${cat.body.data.id}/image`)
      .set('Authorization', auth)
      .attach('image', tmp)
      .expect(200);

    expect(res.body.data.image).toBeTruthy();
    expect(res.body.data.image.mimeType).toBe('image/png');
    fs.unlinkSync(tmp);
  });

  it('rejects forged writable fields on category create', async () => {
    const { auth } = await adminAuth();
    const res = await agent()
      .post('/api/v1/admin/categories')
      .set('Authorization', auth)
      .send({
        name: 'Safe',
        slug: 'safe',
        level: 99,
        ancestors: ['x'],
        createdBy: '507f1f77bcf86cd799439011',
      })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
