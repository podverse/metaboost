export type RegistryAppStatus = 'active' | 'suspended' | 'revoked';

export type RegistrySigningKeyStatus = 'active' | 'retired' | 'revoked';

export type RegistrySigningKey = {
  kid?: string;
  kty: 'OKP';
  crv: 'Ed25519';
  alg: 'EdDSA';
  x: string;
  status: RegistrySigningKeyStatus;
  created_at?: string;
  updated_at?: string;
};

export type RegistryAppRecord = {
  app_id: string;
  display_name: string;
  owner: { name: string; email: string; url?: string };
  status: RegistryAppStatus;
  signing_keys: RegistrySigningKey[];
  created_at: string;
  updated_at: string;
};
