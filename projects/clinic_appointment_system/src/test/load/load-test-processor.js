/**
 * Artillery Load Test Processor
 * Generates dynamic test data for load testing
 */

module.exports = {
  generateSlotId,
  generateRandomPatientId,
};

/**
 * Generate a random slot ID from available slots
 */
function generateSlotId(context, events, done) {
  // Available slots pattern: slot-doctor-seed-001-{day}-{hour}-{minute}
  const availableSlots = [
    'slot-doctor-seed-001-2-9-0',
    'slot-doctor-seed-001-2-9-30',
    'slot-doctor-seed-001-2-10-0',
    'slot-doctor-seed-001-2-10-30',
    'slot-doctor-seed-001-3-9-0',
    'slot-doctor-seed-001-3-9-30',
    'slot-doctor-seed-001-3-10-0',
    'slot-doctor-seed-001-3-10-30',
    'slot-doctor-seed-001-4-10-0',
    'slot-doctor-seed-001-4-10-30',
    'slot-doctor-seed-001-4-11-0',
    'slot-doctor-seed-001-4-15-30',
    'slot-doctor-seed-001-4-16-0',
    'slot-doctor-seed-001-5-9-0',
    'slot-doctor-seed-001-5-9-30',
    'slot-doctor-seed-001-5-10-0',
    'slot-doctor-seed-001-5-10-30',
    'slot-doctor-seed-001-5-15-0',
    'slot-doctor-seed-001-5-15-30',
    'slot-doctor-seed-001-5-16-0',
    'slot-doctor-seed-001-8-9-0',
    'slot-doctor-seed-001-8-10-0',
    'slot-doctor-seed-001-8-11-0',
    'slot-doctor-seed-001-8-11-30',
  ];

  // Pick a random slot
  const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
  context.vars.slotId = randomSlot;

  return done();
}

/**
 * Generate a random patient ID (for concurrent booking tests)
 */
function generateRandomPatientId(context, events, done) {
  const patientNumber = Math.floor(Math.random() * 20) + 1;
  const patientId = `patient-seed-${String(patientNumber).padStart(3, '0')}`;
  context.vars.randomPatientId = patientId;

  return done();
}
