import { PackageURL } from 'packageurl-js';

export class PurlUtils {
  /**
   * Returns a canonical string representation of a PURL.
   * - Lowercases type and namespace (as per spec, some types are case-insensitive, but we enforce lower for consistency)
   * - Preserves name casing if strictly required, but generally purls are lower case in many ecosystems (npm, pypi).
   * - Sorts qualifiers.
   */
  static normalize(purl: string): string {
    try {
      const p = PackageURL.fromString(purl);
      // Canonicalize:
      // PURL spec says: "The scheme, type, and namespace are case-insensitive and should be canonicalized to lowercase."
      // Name is case-insensitive for some types (npm, pypi) but case-sensitive for others (maven, nuget).
      // For simplicity in our system, we will rely on packageurl-js's toString() which handles standard normalization.
      // However, we can enforce specific rules if needed.
      return p.toString();
    } catch (e) {
      // If parsing fails, return original or throw?
      // For now, return original to be safe, but log warning in real app
      return purl;
    }
  }

  static parse(purl: string): PackageURL | null {
    try {
      return PackageURL.fromString(purl);
    } catch (e) {
      return null;
    }
  }

  static generate(
    type: string,
    namespace: string | null,
    name: string,
    version: string | null,
    qualifiers: { [key: string]: string } | null,
    subpath: string | null,
  ): string {
    const p = new PackageURL(type, namespace, name, version, qualifiers, subpath);
    return p.toString();
  }
}
