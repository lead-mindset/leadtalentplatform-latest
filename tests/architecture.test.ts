import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Project Architecture', () => {
  it('should have a lib/services directory for the Service Layer', () => {
    const servicesPath = path.resolve(__dirname, '../lib/services');
    expect(fs.existsSync(servicesPath)).toBe(true);
  });

  it('should have an Engineering Handbook', () => {
    const handbookPath = path.resolve(__dirname, '../docs/handbook/CONTRIBUTING.md');
    expect(fs.existsSync(handbookPath)).toBe(true);
  });
});
