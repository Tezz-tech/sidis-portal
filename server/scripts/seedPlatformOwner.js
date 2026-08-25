require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { User, PricingConfig } = require('../src/models');
const { hashPassword } = require('../src/utils/password');
const env = require('../src/config/env');

async function seed() {
  if (!env.PLATFORM_OWNER_EMAIL || !env.PLATFORM_OWNER_PASSWORD) {
    console.error('Set PLATFORM_OWNER_EMAIL and PLATFORM_OWNER_PASSWORD in .env before seeding');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ organization: null, email: env.PLATFORM_OWNER_EMAIL.toLowerCase() });
  if (existing) {
    console.log('Platform owner already exists:', existing.email);
  } else {
    const passwordHash = await hashPassword(env.PLATFORM_OWNER_PASSWORD);
    const owner = await User.create({
      organization: null,
      email: env.PLATFORM_OWNER_EMAIL.toLowerCase(),
      passwordHash,
      firstName: 'Platform',
      lastName: 'Owner',
      role: 'platform_owner',
      status: 'active',
    });
    console.log('Created platform owner:', owner.email);
  }

  await PricingConfig.getSingleton();
  console.log('Pricing config ready');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
