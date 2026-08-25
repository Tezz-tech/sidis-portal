#!/usr/bin/env node
/**
 * CI guard (Layer 3 of multi-tenancy enforcement, see DATA MODEL / MULTI-TENANCY
 * sections of the project brief): fails the build if a controller calls a
 * tenant-scoped Mongoose model directly instead of going through
 * services/scopedRepo.js's scoped() helper.
 *
 * Organization and PricingConfig are the only collections without an
 * `organization` field, so they are exempt.
 */
const fs = require('fs');
const path = require('path');

const TENANT_SCOPED_MODELS = [
  'Participant',
  'Document',
  'Exam',
  'Question',
  'Invitation',
  'Attempt',
  'CreditTransaction',
  'Payment',
  'AuditLog',
  'User',
];

const MUTATING_METHODS = [
  'find',
  'findOne',
  'findById',
  'create',
  'insertMany',
  'updateOne',
  'updateMany',
  'findByIdAndUpdate',
  'findOneAndUpdate',
  'deleteOne',
  'deleteMany',
  'findByIdAndDelete',
  'findOneAndDelete',
  'countDocuments',
  'exists',
  'aggregate',
];

const controllersDir = path.resolve(__dirname, '../src/controllers');
const jobsDir = path.resolve(__dirname, '../src/jobs');

const methodPattern = new RegExp(`\\b(${TENANT_SCOPED_MODELS.join('|')})\\.(${MUTATING_METHODS.join('|')})\\s*\\(`, 'g');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.name.endsWith('.js')) return [fullPath];
    return [];
  });
}

let violations = [];

for (const file of [...walk(controllersDir), ...walk(jobsDir)]) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Allow model.aggregate() calls that legitimately live inside the scoped()
    // implementation itself, and comments.
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    let match;
    methodPattern.lastIndex = 0;
    while ((match = methodPattern.exec(line))) {
      violations.push({
        file: path.relative(process.cwd(), file),
        line: idx + 1,
        text: trimmed,
        model: match[1],
        method: match[2],
      });
    }
  });
}

if (violations.length > 0) {
  console.error('Tenancy guard failed: direct Mongoose model access found outside scoped().');
  console.error('Use scoped(Model, req.tenant).<method>() instead.\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.model}.${v.method}(...)`);
    console.error(`    ${v.text}`);
  }
  process.exit(1);
}

console.log('Tenancy guard passed: no direct tenant-scoped model access in controllers or jobs.');
process.exit(0);
