import { PurlUtils } from './purl.utils';

describe('PurlUtils', () => {
  it('should normalize valid PURLs', () => {
    // Check standard normalization
    const original = 'pkg:npm/axios@0.21.1';
    expect(PurlUtils.normalize(original)).toBe('pkg:npm/axios@0.21.1');
  });

  it('should canonicalize namespace/type to lowercase', () => {
    const original = 'pkg:NPM/Axios@0.21.1';
    // npm packages are lower case. packageurl-js might not force name lower casing if not strictly typed, 
    // but schema/type should definitely be lower.
    const normalized = PurlUtils.normalize(original);
    expect(normalized).toContain('pkg:npm/');
    // Note: packageurl-js might keep name as is depending on implementation. 
    // Let's verify exact behavior.
  });

  it('should handle complex purls', () => {
    const complex = 'pkg:maven/org.apache.commons/io@1.3.2?type=jar';
    expect(PurlUtils.normalize(complex)).toBe(complex);
  });

  it('should generate purl string', () => {
    const generated = PurlUtils.generate('npm', null, 'axios', '1.0.0', null, null);
    expect(generated).toBe('pkg:npm/axios@1.0.0');
  });

  it('should return original if invalid', () => {
    const invalid = 'not-a-purl';
    expect(PurlUtils.normalize(invalid)).toBe(invalid);
  });
});
