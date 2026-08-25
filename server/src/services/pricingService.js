const { PricingConfig } = require('../models');

async function getPricingConfig() {
  return PricingConfig.getSingleton();
}

async function updatePricingConfig(updates) {
  const config = await PricingConfig.getSingleton();
  Object.assign(config, updates);
  await config.save();
  return config;
}

module.exports = { getPricingConfig, updatePricingConfig };
