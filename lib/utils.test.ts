// VITEST UNIT TEST EXAMPLE FILE
// Untuk menjalankan: `npx vitest` di terminal.
// Konfigurasi vitest.config.ts mungkin diperlukan di root project.

// Impor Vitest akan di-handle oleh test runner
// FIX: Import 'describe', 'it', and 'expect' from 'vitest' to resolve TypeScript errors about missing test runner globals.
import { describe, it, expect } from 'vitest';
import { stripHtml } from './utils.ts';

// Mock Vitest functions if they don't exist in the current browser/sandbox context
if (typeof describe === 'undefined') {
  (globalThis as any).describe = (name: string, fn: () => void) => fn();
  (globalThis as any).it = (name: string, fn: () => void) => fn();
  (globalThis as any).expect = (value: any) => ({
    toBe: (expected: any) => {
      if (value !== expected) {
        throw new Error(`Assertion failed: expected "${expected}" but got "${value}"`);
      }
      console.log(`Test passed for value: ${value}`);
    },
  });
}

// Deskripsikan grup test untuk utility `stripHtml`
describe('stripHtml utility function', () => {
  
  // Test Case 1: HTML sederhana
  it('should remove simple HTML tags like <p> and <b>', () => {
    const input = '<p>Hello <b>World</b></p>';
    const expected = 'Hello World';
    expect(stripHtml(input)).toBe(expected);
  });

  // Test Case 2: String tanpa HTML
  it('should return the same string if no HTML is present', () => {
    const input = 'This is a plain text string.';
    expect(stripHtml(input)).toBe(input);
  });

  // Test Case 3: String kosong
  it('should return an empty string for an empty input', () => {
    const input = '';
    expect(stripHtml(input)).toBe('');
  });

  // Test Case 4: HTML kompleks dengan atribut
  it('should handle complex tags with attributes', () => {
    const input = '<div class="main"><span style="color: red;">Important</span> message.</div>';
    const expected = 'Important message.';
    expect(stripHtml(input)).toBe(expected);
  });

  // Test Case 5: Input null atau undefined (edge case)
  it('should return an empty string for null or undefined input', () => {
    expect(stripHtml(null as any)).toBe('');
    expect(stripHtml(undefined as any)).toBe('');
  });
  
  // Test Case 6: HTML dengan entitas
  it('should correctly decode HTML entities', () => {
    const input = 'Materi &amp; Soal';
    const expected = 'Materi & Soal';
    // Catatan: DOM parser secara otomatis menangani ini.
    expect(stripHtml(input)).toBe(expected);
  });
});