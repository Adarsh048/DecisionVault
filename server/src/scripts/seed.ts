import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { env } from '../config/env';
import { User } from '../models/User';
import { Organization } from '../models/Organization';
import { Team } from '../models/Team';
import { logger } from '../utils/logger';

export const DEMO_CREDENTIALS = [
  {
    role: 'owner',
    name: 'Sarah Chen (Admin / Owner)',
    email: 'admin@decisionvault.io',
    password: 'Password123!',
    title: 'Lead Architect & Owner',
  },
  {
    role: 'member',
    name: 'Alex Rivera (Engineer)',
    email: 'alex@decisionvault.io',
    password: 'Password123!',
    title: 'Senior Full-Stack Engineer',
  },
  {
    role: 'viewer',
    name: 'Jordan Lee (Viewer / Stakeholder)',
    email: 'viewer@decisionvault.io',
    password: 'Password123!',
    title: 'Product Operations (Read-Only)',
  },
];

async function seed() {
  try {
    logger.info('🌱  Starting database seed...');
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clean existing seed collections
    await Promise.all([
      User.deleteMany({ email: { $in: DEMO_CREDENTIALS.map((u) => u.email) } }),
      Organization.deleteMany({ slug: 'acme-corp' }),
      Team.deleteMany({}),
    ]);

    logger.info('Cleared previous demo records');

    // 1. Create Users
    const users: Record<string, any> = {};
    for (const cred of DEMO_CREDENTIALS) {
      const user = await User.create({
        name: cred.name,
        email: cred.email,
        password: cred.password,
      });
      users[cred.role] = user;
      logger.info(`✅ Created user: ${cred.email} (${cred.name})`);
    }

    // 2. Create Organization
    const org = await Organization.create({
      name: 'Acme Corporation',
      slug: 'acme-corp',
      owner: users.owner._id,
      members: [
        { userId: users.owner._id, role: 'owner', joinedAt: new Date() },
        { userId: users.member._id, role: 'member', joinedAt: new Date() },
        { userId: users.viewer._id, role: 'viewer', joinedAt: new Date() },
      ],
    });
    logger.info(`✅ Created organization: ${org.name} (${org.slug})`);

    // Add org reference to users
    await User.updateMany(
      { _id: { $in: Object.values(users).map((u) => u._id) } },
      { $addToSet: { organizations: org._id } }
    );

    // 3. Create Teams
    const coreTeam = await Team.create({
      name: 'Platform Engineering',
      description: 'Core infrastructure, backend services, and offline sync engines',
      organizationId: org._id,
      members: [users.owner._id, users.member._id],
    });

    const productTeam = await Team.create({
      name: 'Product & Design',
      description: 'Design systems, user experience, and product specifications',
      organizationId: org._id,
      members: [users.owner._id, users.viewer._id],
    });

    logger.info(`✅ Created teams: ${coreTeam.name}, ${productTeam.name}`);
    logger.info('🎉 Seeding completed successfully!\n');

    console.log('───────────────────────────────────────────────────────');
    console.log('   DECISIONVAULT DEMO SIGN-IN CREDENTIALS              ');
    console.log('───────────────────────────────────────────────────────');
    DEMO_CREDENTIALS.forEach((c) => {
      console.log(`Role:     ${c.role.toUpperCase()} (${c.title})`);
      console.log(`Email:    ${c.email}`);
      console.log(`Password: ${c.password}`);
      console.log('───────────────────────────────────────────────────────');
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
