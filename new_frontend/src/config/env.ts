/**
 * Environment Configuration
 * Central management of environment variables
 */

interface EnvironmentConfig {
  apiBaseUrl: string;
  appName: string;
  appEnv: 'development' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Validates that all required environment variables are present
 */
function validateEnv(): void {
  const required = ['VITE_API_BASE_URL', 'VITE_APP_NAME', 'VITE_APP_ENV'];
  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.development or .env.production file.'
    );
  }
}

/**
 * Get environment variable with type safety
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}

// Validate environment variables on load
validateEnv();

/**
 * Application environment configuration
 * All environment variables should be accessed through this object
 */
export const env: EnvironmentConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
  appName: getEnvVar('VITE_APP_NAME'),
  appEnv: getEnvVar('VITE_APP_ENV') as 'development' | 'production',
  isDevelopment: getEnvVar('VITE_APP_ENV') === 'development',
  isProduction: getEnvVar('VITE_APP_ENV') === 'production',
};

// Freeze the object to prevent modifications
Object.freeze(env);
