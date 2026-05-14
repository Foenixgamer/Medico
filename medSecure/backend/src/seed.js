// =============================================================================
// MedSecure - Script de seed: datos sintéticos para desarrollo
// Capa 7: Datos sintéticos con faker.js
// =============================================================================

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { faker } = require('@faker-js/faker');
const { pool } = require('./config/database');
const { encrypt } = require('./utils/encryption');
const { config, validateConfig } = require('./config');

validateConfig();

async function seed() {
  console.log('[Seed] Iniciando población de BD con datos sintéticos...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash('TestPass123!', config.bcryptSaltRounds);
    const userIds = [];

    // Crear admin
    const adminToken = uuidv4();
    const admin = await client.query(
      `INSERT INTO users (email, password_hash, role, patient_token, totp_enabled)
       VALUES ($1, $2, 'admin', $3, false)
       RETURNING id`,
      ['admin@medsecure.local', passwordHash, adminToken]
    );
    userIds.push(admin.rows[0].id);
    console.log('[Seed] Admin creado: admin@medsecure.local / TestPass123!');

    // Crear doctores
    const doctorIds = [];
    for (let i = 0; i < 3; i++) {
      const token = uuidv4();
      const email = faker.internet.email({ provider: 'hospital.medsecure' });
      const doc = await client.query(
        `INSERT INTO users (email, password_hash, role, patient_token, totp_enabled)
         VALUES ($1, $2, 'doctor', $3, false)
         RETURNING id`,
        [email, passwordHash, token]
      );
      doctorIds.push(doc.rows[0].id);
      userIds.push(doc.rows[0].id);
      console.log(`[Seed] Doctor creado: ${email} / TestPass123!`);
    }

    // Crear nurses
    for (let i = 0; i < 2; i++) {
      const token = uuidv4();
      const email = faker.internet.email({ provider: 'nurse.medsecure' });
      const nurse = await client.query(
        `INSERT INTO users (email, password_hash, role, patient_token, totp_enabled)
         VALUES ($1, $2, 'nurse', $3, false)
         RETURNING id`,
        [email, passwordHash, token]
      );
      userIds.push(nurse.rows[0].id);
      console.log(`[Seed] Nurse creado: ${email} / TestPass123!`);

      // También crear como paciente para test
    }

    // Crear pacientes
    const patientTokens = [];
    for (let i = 0; i < 10; i++) {
      const token = uuidv4();
      const email = faker.internet.email({ provider: 'paciente.medsecure' });
      const patient = await client.query(
        `INSERT INTO users (email, password_hash, role, patient_token, totp_enabled)
         VALUES ($1, $2, 'patient', $3, false)
         RETURNING id, patient_token`,
        [email, passwordHash, token]
      );
      userIds.push(patient.rows[0].id);
      patientTokens.push(patient.rows[0].patient_token);
      console.log(`[Seed] Paciente creado: ${email} / TestPass123!`);

      // Crear perfil de paciente con PHI cifrado
      const fullName = faker.person.fullName();
      const dateOfBirth = faker.date.birthdate({ min: 18, max: 90, mode: 'age' }).toISOString().split('T')[0];
      const phone = faker.phone.number();
      const address = faker.location.streetAddress();
      const emergencyContact = faker.person.fullName();

      await client.query(
        `INSERT INTO patients (user_id, full_name, date_of_birth, phone, address,
                               emergency_contact, patient_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          patient.rows[0].id,
          encrypt(fullName),
          encrypt(dateOfBirth),
          encrypt(phone),
          encrypt(address),
          encrypt(emergencyContact),
          patient.rows[0].patient_token,
        ]
      );

      // Asignar algunos pacientes a doctores
      if (i < 5 && doctorIds.length > 0) {
        const doctorId = doctorIds[i % doctorIds.length];
        await client.query(
          `INSERT INTO patient_assignments (doctor_id, patient_token)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [doctorId, patient.rows[0].patient_token]
        );
      }

      // Crear expedientes médicos sintéticos
      const numRecords = faker.number.int({ min: 1, max: 4 });
      for (let j = 0; j < numRecords; j++) {
        await client.query(
          `INSERT INTO medical_records (patient_token, diagnosis, medications, history, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            patient.rows[0].patient_token,
            encrypt(faker.helpers.arrayElement([
              'Hypertension', 'Type 2 Diabetes', 'Asthma', 'Migraine',
              'GERD', 'Hypothyroidism', 'Anxiety Disorder', 'Seasonal Allergies',
              'Osteoarthritis', 'Insomnia',
            ])),
            encrypt(JSON.stringify([
              faker.string.alpha(10),
              faker.string.alpha(8),
            ])),
            encrypt(faker.lorem.paragraph()),
            encrypt(faker.lorem.sentence()),
            doctorIds[j % doctorIds.length],
          ]
        );
      }
    }

    // Consent logs
    for (const userId of userIds) {
      await client.query(
        `INSERT INTO consent_log (user_id, action, terms_version, ip_address)
         VALUES ($1, 'granted', '1.0', '127.0.0.1')`,
        [userId]
      );
    }

    await client.query('COMMIT');
    console.log('\n[Seed] BD poblada exitosamente con datos sintéticos!');
    console.log('[Seed] Credenciales de prueba: cualquier usuario / TestPass123!');
    console.log('[Seed] Admin:        admin@medsecure.local');
    console.log('[Seed] Doctores:     Ver logs arriba');
    console.log('[Seed] Enfermeros:   Ver logs arriba');
    console.log('[Seed] Pacientes:   Ver logs arriba');
    console.log('[Seed] MFA:         Deshabilitado por defecto, configurar en dashboard');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Seed] Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[Seed] Fatal:', err);
  process.exit(1);
});
