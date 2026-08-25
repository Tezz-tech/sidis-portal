/**
 * Every data access in a controller must go through this helper. It injects the
 * organization filter from the verified tenant context so a missing scope is
 * structurally impossible rather than a discipline problem.
 *
 * Direct Model.find()/findById()/etc calls in controller code are a bug — see
 * scripts/checkTenancy.js, which fails the build if it finds one.
 */
function scoped(Model, tenant) {
  if (!tenant || !tenant.organizationId) {
    throw new Error('scoped() requires a tenant context with an organizationId');
  }
  const orgFilter = { organization: tenant.organizationId };

  return {
    find: (filter = {}, projection, options) => Model.find({ ...filter, ...orgFilter }, projection, options),
    findOne: (filter = {}, projection, options) => Model.findOne({ ...filter, ...orgFilter }, projection, options),
    findById: (id, projection, options) => Model.findOne({ _id: id, ...orgFilter }, projection, options),
    create: (doc) => Model.create({ ...doc, organization: tenant.organizationId }),
    insertMany: (docs, options) => Model.insertMany(
      docs.map((d) => ({ ...d, organization: tenant.organizationId })),
      options,
    ),
    updateOne: (filter, update, options) => Model.updateOne({ ...filter, ...orgFilter }, update, options),
    updateMany: (filter, update, options) => Model.updateMany({ ...filter, ...orgFilter }, update, options),
    findByIdAndUpdate: (id, update, options) => Model.findOneAndUpdate({ _id: id, ...orgFilter }, update, options),
    findOneAndUpdate: (filter, update, options) => Model.findOneAndUpdate({ ...filter, ...orgFilter }, update, options),
    deleteOne: (filter) => Model.deleteOne({ ...filter, ...orgFilter }),
    deleteMany: (filter) => Model.deleteMany({ ...filter, ...orgFilter }),
    findByIdAndDelete: (id) => Model.findOneAndDelete({ _id: id, ...orgFilter }),
    countDocuments: (filter = {}) => Model.countDocuments({ ...filter, ...orgFilter }),
    exists: (filter = {}) => Model.exists({ ...filter, ...orgFilter }),
    aggregate: (pipeline = []) => Model.aggregate([{ $match: orgFilter }, ...pipeline]),
  };
}

module.exports = { scoped };
