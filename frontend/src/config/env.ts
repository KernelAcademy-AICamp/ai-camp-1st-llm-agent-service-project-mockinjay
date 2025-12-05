const APP_ENVS = ['development', 'production'] as const;
type AppEnvironment = (typeof APP_ENVS)[number];

export interface EnvironmentConfig {
  apiBaseUrl: string;
  appName: string;
  appEnv: AppEnvironment;
  isDevelopment: boolean;
  isProduction: boolean;
}

const REQUIRED_ENV_KEYS = ['VITE_API_BASE_URL', 'VITE_APP_NAME', 'VITE_APP_ENV'] as const;
type RequiredEnvKey = (typeof REQUIRED_ENV_KEYS)[number];

function validateEnv(env: ImportMetaEnv): void {
  const missingKeys = REQUIRED_ENV_KEYS.filter(key => env[key] === undefined);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(', ')}. ` +
        'Ensure the variables exist in your Vite environment files (.env, .env.local, etc.).'
    );
  }
}

export function getEnvVar(key: RequiredEnvKey, defaultValue?: string): string {
  const value = import.meta.env[key];

  // Allow empty string for VITE_API_BASE_URL (uses Vite proxy in development)
  if (key === 'VITE_API_BASE_URL' && value === '') {
    return '';
  }

  if (value === undefined || value === null || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not defined`);
  }

  return String(value);
}

validateEnv(import.meta.env);

const appEnv = getEnvVar('VITE_APP_ENV') as AppEnvironment;

const environment: EnvironmentConfig = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
  appName: getEnvVar('VITE_APP_NAME'),
  appEnv,
  isDevelopment: appEnv === 'development',
  isProduction: appEnv === 'production',
};

export const env: Readonly<EnvironmentConfig> = Object.freeze(environment);
