const mongoose = require('mongoose');

let Organization;
let Payment;
let CreditTransaction;
let creditService;
let billingService;

jest.mock('../src/services/paystackService', () => ({
  verifyTransaction: jest.fn(),
  initializeTransaction: jest.fn(),
  verifyWebhookSignature: jest.fn(),
}));

beforeAll(async () => {
  const connectDB = require('../src/config/db');
  await connectDB();
  ({ Organization, Payment, CreditTransaction } = require('../src/models'));
  creditService = require('../src/services/creditService');
  billingService = require('../src/services/billingService');
});

afterAll(async () => {
  await mongoose.connection.close();
});

afterEach(async () => {
  jest.clearAllMocks();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('credit ledger', () => {
  test('balance never goes negative when debiting more than available', async () => {
    const org = await Organization.create({ name: 'Org', slug: 'org-credits', creditBalance: 10 });

    await expect(
      creditService.reserve({ organizationId: org._id, amount: 50, description: 'too much' }),
    ).rejects.toThrow(/credits/i);

    const refreshed = await Organization.findById(org._id);
    expect(refreshed.creditBalance).toBe(10);

    const entries = await CreditTransaction.countDocuments({ organization: org._id });
    expect(entries).toBe(0);
  });

  test('concurrent debits never push balance below zero', async () => {
    const org = await Organization.create({ name: 'Org', slug: 'org-concurrent', creditBalance: 10 });

    const attempts = Array.from({ length: 5 }).map(() =>
      creditService.reserve({ organizationId: org._id, amount: 4, description: 'concurrent debit' }).catch((e) => e),
    );
    await Promise.all(attempts);

    const refreshed = await Organization.findById(org._id);
    expect(refreshed.creditBalance).toBeGreaterThanOrEqual(0);
    // 10 credits / 4 per debit: exactly two debits should succeed (8 spent), one fails.
    expect(refreshed.creditBalance).toBe(2);
  });

  test('reserve then release returns credits to the balance', async () => {
    const org = await Organization.create({ name: 'Org', slug: 'org-release', creditBalance: 20 });
    await creditService.reserve({ organizationId: org._id, amount: 15, description: 'reserve' });
    await creditService.release({ organizationId: org._id, amount: 15, description: 'release' });

    const refreshed = await Organization.findById(org._id);
    expect(refreshed.creditBalance).toBe(20);
  });

  test('a replayed Paystack webhook credits the account exactly once', async () => {
    const org = await Organization.create({ name: 'Org', slug: 'org-webhook', creditBalance: 0 });
    const payment = await Payment.create({
      organization: org._id,
      paystackReference: 'ref_123',
      amountKobo: 500000,
      creditsPurchased: 100,
      status: 'pending',
    });

    const paystackService = require('../src/services/paystackService');
    paystackService.verifyTransaction.mockResolvedValue({ status: 'success', paid_at: new Date().toISOString() });

    await billingService.handleChargeSuccess('ref_123');
    await billingService.handleChargeSuccess('ref_123'); // replay

    const refreshedOrg = await Organization.findById(org._id);
    expect(refreshedOrg.creditBalance).toBe(100);

    const refreshedPayment = await Payment.findById(payment._id);
    expect(refreshedPayment.status).toBe('success');

    const purchaseEntries = await CreditTransaction.countDocuments({ organization: org._id, type: 'purchase' });
    expect(purchaseEntries).toBe(1);

    expect(paystackService.verifyTransaction).toHaveBeenCalledTimes(1);
  });
});
