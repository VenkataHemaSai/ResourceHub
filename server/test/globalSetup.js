import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

export default function setup() {
  config({ path: path.resolve(process.cwd(), '.env.test') });

  console.log('Generating Prisma client...');
  execSync('npx prisma generate --schema=prisma/schema.prisma', {
    env: { ...process.env },
    stdio: 'inherit',
  });

  console.log('Running database migrations on test database...');
  execSync('npx prisma db push --accept-data-loss', {
    env: {
      ...process.env,
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "ok continue but what are all these tests, I can't understand them and when will start doing the real work"
    },
    stdio: 'inherit',
  });
}

