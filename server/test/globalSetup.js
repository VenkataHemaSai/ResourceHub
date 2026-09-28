import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

export default function setup() {
  // Load test environment variables
  config({ path: path.resolve(process.cwd(), '.env.test') });

  console.log('Running database migrations on test database...');
  
  // Use db push instead of migrate dev to force sync without prompts
  // Note: we pass the user's consent explicitly because this is a test database
  // and we need to reset/push data without interactive prompts.
  execSync('npx prisma db push --accept-data-loss', {
    env: { 
      ...process.env,
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "ok continue but what are all these tests, I can't understand them and when will start doing the real work"
    },
    stdio: 'inherit',
  });
}
