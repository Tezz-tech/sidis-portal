const Agenda = require('agenda');
const env = require('./env');
const logger = require('./logger');

let agenda;
let readyPromise;

/**
 * A single Agenda instance backs both roles: the API process only ever calls
 * now()/schedule()/cancel()/jobs() to enqueue and read jobs, while the worker
 * process additionally calls define() and start() to actually run them.
 *
 * Unlike start(), Agenda's enqueue-side methods (now/schedule/cancel/jobs) do
 * NOT wait for the underlying Mongo connection themselves — calling them
 * before it's ready throws. getReadyAgenda() is the safe entry point for the
 * API process; the readiness listener is attached synchronously at
 * construction time so it can never miss the 'ready' event.
 */
function getAgenda() {
  if (!agenda) {
    agenda = new Agenda({
      db: { address: env.MONGODB_URI, collection: 'agendaJobs' },
      processEvery: '5 seconds',
      maxConcurrency: 10,
    });
    agenda.on('error', (err) => logger.error({ err }, 'Agenda connection error'));
    readyPromise = new Promise((resolve) => agenda.once('ready', resolve));
  }
  return agenda;
}

async function getReadyAgenda() {
  getAgenda();
  await readyPromise;
  return agenda;
}

module.exports = { getAgenda, getReadyAgenda };
