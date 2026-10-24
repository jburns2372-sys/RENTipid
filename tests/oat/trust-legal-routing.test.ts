import * as fs from 'fs';
import * as path from 'path';

describe('Trust & Legal Routing Static Check', () => {
  const pagesDir = path.join(process.cwd(), 'src/app');
  
  test('TRUST_LEGAL_HUB_ROUTE: PASS', () => {
    const p = path.join(pagesDir, 'help/trust-safety-legal/page.tsx');
    expect(fs.existsSync(p)).toBe(true);
  });
  
  test('PROHIBITED_ITEMS_ROUTE: PASS', () => {
    const p = path.join(pagesDir, 'prohibited-items/page.tsx');
    expect(fs.existsSync(p)).toBe(true);
  });
  
  test('PROHIBITED_ITEMS_LINK_TARGET: PASS', () => {
    const p = path.join(pagesDir, 'help/trust-safety-legal/page.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('href="/prohibited-items"');
  });
  
  test('INTELLECTUAL_PROPERTY_ROUTE: PASS', () => {
    const p = path.join(pagesDir, 'help/intellectual-property/page.tsx');
    expect(fs.existsSync(p)).toBe(true);
  });
  
  test('INTELLECTUAL_PROPERTY_LINK_TARGET: PASS', () => {
    const p = path.join(pagesDir, 'help/trust-safety-legal/page.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('href="/help/intellectual-property"');
  });
  
  test('GLOBAL_LEGAL_COMPLIANCE_ROUTE: PASS', () => {
    const p = path.join(pagesDir, 'help/trust-safety-legal/global-legal-compliance/page.tsx');
    expect(fs.existsSync(p)).toBe(true);
  });
  
  test('GLOBAL_LEGAL_COMPLIANCE_LINK_TARGET: PASS', () => {
    const p = path.join(pagesDir, 'help/trust-safety-legal/page.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    expect(content).toContain('href="/help/trust-safety-legal/global-legal-compliance"');
  });
  
  test('NO_CROSS_ROUTING: PASS', () => {
    const p = path.join(pagesDir, 'help/trust-safety-legal/page.tsx');
    const content = fs.readFileSync(p, 'utf-8');
    // Ensure no two links go to the same place if they shouldn't.
    // They are distinct in the file.
    expect(content.match(/href="\/prohibited-items"/g)?.length).toBe(1);
    expect(content.match(/href="\/help\/intellectual-property"/g)?.length).toBe(1);
  });
});
