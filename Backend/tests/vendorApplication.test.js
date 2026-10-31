const path = require('path');
const fs = require('fs');
const os = require('os');
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
const { APPLICATION_STATUSES } = require('../src/constants/applicationStatuses');
const { VendorApplication } = require('../src/models/VendorApplication');
const { AuditLog } = require('../src/models/AuditLog');

describe('Phase 2 Vendor application lifecycle', () => {
  beforeAll(async () => {
    await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await clearDb();
  });

  async function registerVendor(email = 'seller@example.com') {
    const res = await agent()
      .post('/api/v1/auth/vendor-register')
      .send({
        fullName: 'Seller One',
        email,
        password: 'Password1',
      })
      .expect(201);
    return res.body.data.user;
  }

  async function login(email, password = 'Password1') {
    const res = await agent()
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    return res.body.data;
  }

  const profile = {
    shopName: 'Green Goods',
    description: 'We sell sustainable home goods for everyday living.',
    supportEmail: 'support@greengoods.test',
    phone: '+1 555 0100',
  };

  it('creates a DRAFT application on vendor-register', async () => {
    const user = await registerVendor();
    const app = await VendorApplication.findOne({ userId: user.id });
    expect(app).toBeTruthy();
    expect(app.applicationStatus).toBe(APPLICATION_STATUSES.DRAFT);
  });

  it('lets a vendor save and submit a business profile', async () => {
    const user = await registerVendor();
    const session = await login(user.email);

    await agent()
      .put('/api/v1/vendor/application')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send(profile)
      .expect(200);

    const submitted = await agent()
      .post('/api/v1/vendor/application/submit')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200);

    expect(submitted.body.data.applicationStatus).toBe(
      APPLICATION_STATUSES.SUBMITTED
    );
    expect(submitted.body.data.slug).toMatch(/green-goods/);
  });

  it('blocks customers from vendor application routes', async () => {
    const customer = await createUser({
      email: 'c@example.com',
      role: ROLES.CUSTOMER,
      status: STATUSES.ACTIVE,
    });
    await agent()
      .get('/api/v1/vendor/application')
      .set('Authorization', authHeader(customer))
      .expect(403);
  });

  it('blocks vendors from forging role/status on profile update', async () => {
    const user = await registerVendor('forge@example.com');
    const session = await login(user.email);
    const res = await agent()
      .put('/api/v1/vendor/application')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .send({
        ...profile,
        applicationStatus: 'APPROVED',
        role: 'ADMIN',
      })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('admin can list, approve; vendor then reaches dashboard', async () => {
    const vendorUser = await registerVendor('approve@example.com');
    const vendorSession = await login(vendorUser.email);
    await agent()
      .put('/api/v1/vendor/application')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .send(profile)
      .expect(200);
    await agent()
      .post('/api/v1/vendor/application/submit')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .expect(200);

    const admin = await createUser({
      email: 'admin@example.com',
      role: ROLES.ADMIN,
      status: STATUSES.ACTIVE,
    });

    const listed = await agent()
      .get('/api/v1/admin/vendor-applications?status=SUBMITTED')
      .set('Authorization', authHeader(admin))
      .expect(200);

    expect(listed.body.data.items).toHaveLength(1);
    expect(listed.body.data.pagination.total).toBe(1);
    const applicationId = listed.body.data.items[0].id;

    const approved = await agent()
      .post(`/api/v1/admin/vendor-applications/${applicationId}/approve`)
      .set('Authorization', authHeader(admin))
      .expect(200);

    expect(approved.body.data.applicationStatus).toBe(
      APPLICATION_STATUSES.APPROVED
    );
    expect(approved.body.data.user.status).toBe(STATUSES.ACTIVE);

    const dash = await agent()
      .get('/api/v1/vendor/dashboard')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .expect(200);
    expect(dash.body.data.message).toBe('Vendor dashboard');

    const audits = await AuditLog.find({ action: 'APPLICATION_APPROVED' });
    expect(audits.length).toBe(1);
  });

  it('requires rejection reason and allows resubmit', async () => {
    const vendorUser = await registerVendor('reject@example.com');
    const vendorSession = await login(vendorUser.email);
    await agent()
      .put('/api/v1/vendor/application')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .send(profile)
      .expect(200);
    const submitted = await agent()
      .post('/api/v1/vendor/application/submit')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .expect(200);

    const admin = await createUser({
      email: 'admin2@example.com',
      role: ROLES.ADMIN,
      status: STATUSES.ACTIVE,
    });

    await agent()
      .post(
        `/api/v1/admin/vendor-applications/${submitted.body.data.id}/reject`
      )
      .set('Authorization', authHeader(admin))
      .send({})
      .expect(400);

    const rejected = await agent()
      .post(
        `/api/v1/admin/vendor-applications/${submitted.body.data.id}/reject`
      )
      .set('Authorization', authHeader(admin))
      .send({ reason: 'Incomplete business documentation provided.' })
      .expect(200);

    expect(rejected.body.data.applicationStatus).toBe(
      APPLICATION_STATUSES.REJECTED
    );
    expect(rejected.body.data.rejectionReason).toMatch(/Incomplete/);

    await agent()
      .put('/api/v1/vendor/application')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .send({
        ...profile,
        description:
          'Updated sustainable home goods description with more detail.',
      })
      .expect(200);

    const resubmitted = await agent()
      .post('/api/v1/vendor/application/submit')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .expect(200);
    expect(resubmitted.body.data.applicationStatus).toBe(
      APPLICATION_STATUSES.SUBMITTED
    );
  });

  it('suspend blocks login; reactivate restores approved vendors', async () => {
    const vendorUser = await registerVendor('suspend@example.com');
    const vendorSession = await login(vendorUser.email);
    await agent()
      .put('/api/v1/vendor/application')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .send(profile)
      .expect(200);
    const submitted = await agent()
      .post('/api/v1/vendor/application/submit')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .expect(200);

    const admin = await createUser({
      email: 'admin3@example.com',
      role: ROLES.ADMIN,
      status: STATUSES.ACTIVE,
    });

    await agent()
      .post(
        `/api/v1/admin/vendor-applications/${submitted.body.data.id}/approve`
      )
      .set('Authorization', authHeader(admin))
      .expect(200);

    await agent()
      .post(`/api/v1/admin/vendors/${vendorUser.id}/suspend`)
      .set('Authorization', authHeader(admin))
      .send({ reason: 'Policy violation under review by ops team.' })
      .expect(200);

    await agent()
      .post('/api/v1/auth/login')
      .send({ email: vendorUser.email, password: 'Password1' })
      .expect(403);

    await agent()
      .post(`/api/v1/admin/vendors/${vendorUser.id}/reactivate`)
      .set('Authorization', authHeader(admin))
      .expect(200);

    await agent()
      .post('/api/v1/auth/login')
      .send({ email: vendorUser.email, password: 'Password1' })
      .expect(200);
  });

  it('prevents vendors from accessing admin review APIs', async () => {
    const vendorUser = await registerVendor('noadmin@example.com');
    const vendorSession = await login(vendorUser.email);
    await agent()
      .get('/api/v1/admin/vendor-applications')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .expect(403);
  });

  it('accepts an authorized document upload for editable applications', async () => {
    const vendorUser = await registerVendor('docs@example.com');
    const vendorSession = await login(vendorUser.email);
    const tmp = path.join(os.tmpdir(), `emporia-doc-${Date.now()}.pdf`);
    fs.writeFileSync(tmp, '%PDF-1.4 emporia test');

    const res = await agent()
      .post('/api/v1/vendor/application/documents')
      .set('Authorization', `Bearer ${vendorSession.accessToken}`)
      .attach('document', tmp)
      .expect(201);

    expect(res.body.data.documents).toHaveLength(1);
    expect(res.body.data.documents[0].mimeType).toBe('application/pdf');
    fs.unlinkSync(tmp);
  });
});
