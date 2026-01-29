import * as fc from 'fast-check';
import { env } from './env';

describe('Environment Configuration', () => {
  describe('Property 1: Environment Variable Loading', () => {
    it('should have valid port number', () => {
      fc.assert(
        fc.property(fc.constant(env.port), (port) => {
          return port > 0 && port <= 65535;
        }),
        { numRuns: 100 }
      );
    });

    it('should have valid rate limit configuration', () => {
      fc.assert(
        fc.property(
          fc.constant(env.rateLimitWindowMs),
          fc.constant(env.rateLimitMaxRequests),
          (windowMs, maxRequests) => {
            return windowMs > 0 && maxRequests > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty JWT secrets', () => {
      expect(env.jwtAccessSecret).toBeTruthy();
      expect(env.jwtRefreshSecret).toBeTruthy();
      expect(env.jwtAccessSecret.length).toBeGreaterThan(0);
      expect(env.jwtRefreshSecret.length).toBeGreaterThan(0);
    });

    it('should have valid MongoDB URI format', () => {
      expect(env.mongodbUri).toBeTruthy();
      expect(env.mongodbUri).toMatch(/^mongodb/);
    });

    it('should have valid node environment', () => {
      expect(['development', 'production', 'test']).toContain(env.nodeEnv);
    });
  });
});
