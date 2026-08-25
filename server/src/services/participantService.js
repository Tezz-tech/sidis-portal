const { scoped } = require('./scopedRepo');
const { Participant } = require('../models');
const AppError = require('../utils/AppError');

async function listParticipants(tenant, { search, tag, page = 1, limit = 50 } = {}) {
  const filter = {};
  if (tag) filter.tags = tag;
  if (search) {
    filter.$or = [
      { email: new RegExp(search, 'i') },
      { firstName: new RegExp(search, 'i') },
      { lastName: new RegExp(search, 'i') },
      { externalId: new RegExp(search, 'i') },
    ];
  }
  const repo = scoped(Participant, tenant);
  const [items, total] = await Promise.all([
    repo.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    repo.countDocuments(filter),
  ]);
  return { items, total, page: Number(page), limit: Number(limit) };
}

async function createParticipant(tenant, data) {
  const existing = await scoped(Participant, tenant).findOne({ email: data.email.toLowerCase() });
  if (existing) {
    throw new AppError('A participant with that email already exists', 409, 'ALREADY_EXISTS');
  }
  return scoped(Participant, tenant).create({ ...data, email: data.email.toLowerCase() });
}

async function updateParticipant(tenant, id, updates) {
  const participant = await scoped(Participant, tenant).findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!participant) throw new AppError('Participant not found', 404, 'NOT_FOUND');
  return participant;
}

async function deleteParticipant(tenant, id) {
  const result = await scoped(Participant, tenant).deleteOne({ _id: id });
  if (result.deletedCount === 0) throw new AppError('Participant not found', 404, 'NOT_FOUND');
}

/**
 * Bulk import used by the CSV upload flow. The frontend does column mapping
 * and validation preview before calling this, so rows here are already
 * shaped — this just upserts by (organization, email), which is the unique
 * key, so a re-import updates rather than duplicates.
 */
async function importParticipants(tenant, rows) {
  const results = { created: 0, updated: 0, errors: [] };
  const repo = scoped(Participant, tenant);

  for (const row of rows) {
    try {
      const email = row.email.toLowerCase();
      const existing = await repo.findOne({ email });
      if (existing) {
        await repo.updateOne({ _id: existing._id }, {
          firstName: row.firstName,
          lastName: row.lastName,
          externalId: row.externalId || existing.externalId,
          tags: row.tags && row.tags.length ? row.tags : existing.tags,
        });
        results.updated += 1;
      } else {
        await repo.create({ ...row, email });
        results.created += 1;
      }
    } catch (err) {
      results.errors.push({ email: row.email, message: err.message });
    }
  }
  return results;
}

module.exports = { listParticipants, createParticipant, updateParticipant, deleteParticipant, importParticipants };
