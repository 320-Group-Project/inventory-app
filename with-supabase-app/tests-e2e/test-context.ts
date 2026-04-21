import fs from 'fs';
import path from 'path';

export interface TestContext {
  suffix: string;
  clubId: number;
  testClubName: string;
  adminUserId: string;
  memberUserId: string;
  otherUserId: string;
  adminEmail: string;
  memberEmail: string;
  otherEmail: string;
}

export function loadContext(): TestContext {
  const file = path.join(__dirname, 'test-context.json');
  if (!fs.existsSync(file)) {
    throw new Error(
      'test-context.json not found — global setup may not have run.\n' +
      'Make sure to run: npx playwright test (not just a single spec file)',
    );
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as TestContext;
}
