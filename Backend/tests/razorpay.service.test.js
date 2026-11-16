const crypto = require('crypto');
const {
  verifyPaymentSignature,
  toPaise,
  resetRazorpayClient,
} = require('../src/services/razorpay.service');
const { resetEnvCache } = require('../src/config/env');
const { ApiError } = require('../src/utils/ApiError');

describe('razorpay.service', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
    resetEnvCache();
    resetRazorpayClient();
  });

  it('converts major units to paise', () => {
    expect(toPaise(499)).toBe(49900);
    expect(toPaise(10.5)).toBe(1050);
  });

  it('verifies a valid payment signature', () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_x';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test';
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || 'a'.repeat(40);
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || 'b'.repeat(40);
    resetEnvCache();

    const razorpayOrderId = 'order_abc';
    const razorpayPaymentId = 'pay_xyz';
    const razorpaySignature = crypto
      .createHmac('sha256', 'test_secret')
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    expect(
      verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      })
    ).toBe(true);
  });

  it('rejects an invalid signature', () => {
    process.env.RAZORPAY_KEY_ID = 'rzp_test_x';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.MONGODB_URI =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/test';
    process.env.JWT_ACCESS_SECRET =
      process.env.JWT_ACCESS_SECRET || 'a'.repeat(40);
    process.env.JWT_REFRESH_SECRET =
      process.env.JWT_REFRESH_SECRET || 'b'.repeat(40);
    resetEnvCache();

    expect(() =>
      verifyPaymentSignature({
        razorpayOrderId: 'order_abc',
        razorpayPaymentId: 'pay_xyz',
        razorpaySignature: 'deadbeef',
      })
    ).toThrow(ApiError);
  });
});
