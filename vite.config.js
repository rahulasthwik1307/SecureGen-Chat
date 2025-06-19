import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Add a virtual module for crypto polyfill
    {
      name: 'crypto-polyfill',
      resolveId(id) {
        if (id === 'crypto') {
          // Return a virtual module ID that's clearly marked
          return '\0virtual:crypto-polyfill';
        }
        return null;
      },
      load(id) {
        if (id === '\0virtual:crypto-polyfill') {
          // Comprehensive polyfill that provides crypto functionality for bcryptjs
          return `
            // Create a more complete Buffer-like class to satisfy bcryptjs
            class BufferPolyfill extends Uint8Array {
              constructor(input, encodingOrOffset, length) {
                if (typeof input === 'number') {
                  super(input);
                } else if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
                  super(input);
                } else if (Array.isArray(input)) {
                  // Handle array input
                  super(input);
                } else {
                  super(0);
                }
              }
              
              toString(encoding) {
                if (encoding === 'hex') {
                  return Array.from(this)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                } else if (encoding === 'base64') {
                  // Simple base64 implementation
                  try {
                    return btoa(String.fromCharCode.apply(null, this));
                  } catch (e) {
                    return '';
                  }
                }
                return String.fromCharCode.apply(null, this);
              }
              
              // Add other Buffer methods that bcryptjs might use
              slice(start, end) {
                return new BufferPolyfill(super.slice(start, end));
              }
              
              // Add static methods that bcryptjs might use
              static from(data) {
                if (Array.isArray(data)) {
                  return new BufferPolyfill(data);
                } else if (typeof data === 'string') {
                  const buf = new BufferPolyfill(data.length);
                  for (let i = 0; i < data.length; i++) {
                    buf[i] = data.charCodeAt(i);
                  }
                  return buf;
                }
                return new BufferPolyfill(0);
              }
              
              static isBuffer(obj) {
                return obj instanceof BufferPolyfill;
              }
            }
            
            // Create a randomBytes function that returns our Buffer-like object
            function randomBytes(size) {
              const buffer = new BufferPolyfill(size);
              if (window.crypto && window.crypto.getRandomValues) {
                window.crypto.getRandomValues(buffer);
              } else {
                // Fallback for older browsers
                for (let i = 0; i < size; i++) {
                  buffer[i] = Math.floor(Math.random() * 256);
                }
              }
              
              // Add toString method directly to the buffer instance for bcryptjs compatibility
              buffer.toString = function(encoding) {
                if (encoding === 'hex') {
                  return Array.from(this)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                } else if (encoding === 'base64') {
                  try {
                    return btoa(String.fromCharCode.apply(null, this));
                  } catch (e) {
                    return '';
                  }
                }
                return String.fromCharCode.apply(null, this);
              };
              
              return buffer;
            }
            
            // Mock createHash function that bcryptjs might use
            function createHash(algorithm) {
              return {
                update: (data) => {
                  return {
                    digest: (encoding) => {
                      console.warn('Crypto createHash is not fully implemented in this polyfill');
                      // Return a dummy hash
                      return encoding === 'hex' ? '0'.repeat(64) : new BufferPolyfill(32);
                    }
                  };
                }
              };
            }
            
            // Mock createHmac function
            function createHmac(algorithm, key) {
              return {
                update: (data) => {
                  return {
                    digest: (encoding) => {
                      console.warn('Crypto createHmac is not fully implemented in this polyfill');
                      // Return a dummy hash
                      return encoding === 'hex' ? '0'.repeat(64) : new BufferPolyfill(32);
                    }
                  };
                }
              };
            }
            
            // Export in multiple ways to ensure compatibility
            export { randomBytes, createHash, createHmac };
            export default { 
              randomBytes,
              createHash,
              createHmac,
              // Add Buffer reference for compatibility
              Buffer: {
                from: BufferPolyfill.from,
                isBuffer: BufferPolyfill.isBuffer
              }
            };
            
            // Make randomBytes available as both a named export and a property
            randomBytes.randomBytes = randomBytes;
          `;
        }
        return null;
      }
    }
  ],
  server: {
    port: 3000,
  },
  // No need for resolve.alias as the plugin directly handles 'crypto' module ID
  define: {
    // Define global as globalThis for browser compatibility
    global: 'globalThis'
  }
});