#!/usr/bin/env node
/**
 * CI guard (Layer 3 of multi-tenancy enforcement, see DATA MODEL / MULTI-TENANCY
 * sections of the project brief): fails the build if a controller, job, or
 * service calls a tenant-scoped Mongoose model directly instead of going
 * through services/scopedRepo.js's scoped() helper.
 *
 * Organization and PricingConfig are the only collections without an
 * `organization` field, so they are exempt. Individual files under
 * src/services/ can also be exempted via EXEMPT_SERVICE_FILES below, for
 * code that legitimately queries across tenants or before a tenant is known
 * — see the comment on each entry.
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
const servicesDir = path.resolve(__dirname, '../src/services');

// Services (unlike controllers) legitimately contain code that operates
// across tenants by construction, or before a tenant is even known — the
// guard would otherwise flood on these. Each exemption is a deliberate,
// reviewed judgment call, not a blanket opt-out: re-check this list any
// time one of these files changes what it queries.
const EXEMPT_SERVICE_FILES = {
  // Platform-owner surface: no "current tenant" exists for these requests —
  // every query is explicitly scoped by whichever organizationId was passed
  // in as a parameter (from the URL, not from a tenant context).
  'organizationService.js': 'platform-owner service, scoped by an explicit organizationId param',
  'dataProtectionService.js': 'platform-owner GDPR/NDPR export+erase tool, scoped by an explicit organizationId param',
  'platformMetricsService.js': 'platform-owner cross-org aggregate stats and payment listing, by design',
  // grant/adjust/purchase/refund all take an explicit organizationId param
  // and are called from both tenant-scoped and platform-owner call sites.
  'creditService.js': 'balance mutations take an explicit organizationId param, not a tenant context',
  // These run before a tenant is known at all — that's the point of the call.
  'authService.js': 'pre-tenant-context lookups (login by email, invite/reset tokens) before an org is known',
  'participantAuthService.js': 'pre-tenant-context lookups (invite by token) before an org is known',
  'billingService.js': 'Payment is looked up by paystackReference (webhook/confirm flow has no tenant yet); the org comes from the found payment',
  // Deliberately cross-org by design, not reachable from a tenant request.
  'deadlineSweepService.js': 'background sweep across all organizations, not tenant-request-driven',
  'auditService.js': 'the audit log writer/reader itself',
  // Participant-session-scoped, not req.tenant-scoped — scoped() is built
  // around a staff tenant context. These filter manually by
  // organization/derived IDs instead; verified safe by reading the
  // staff-facing entry points (resultService.js) that these ultimately feed.
  'attemptService.js': 'participant-session-scoped (not req.tenant), filtered manually by session.organizationId',
  'gradingService.js': 'operates on attempt IDs derived from an authenticated participant session or internal queue jobs, never raw req.params',
};

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

for (const file of [...walk(controllersDir), ...walk(jobsDir), ...walk(servicesDir)]) {
  if (Object.prototype.hasOwnProperty.call(EXEMPT_SERVICE_FILES, path.basename(file))) continue;
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

console.log('Tenancy guard passed: no direct tenant-scoped model access in controllers, jobs, or non-exempt services.');
process.exit(0);
