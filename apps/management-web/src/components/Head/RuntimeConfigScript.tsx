import type { ManagementWebRuntimeConfig } from '../../config/runtime-config';

import Script from 'next/script';

const serialize = (config: ManagementWebRuntimeConfig): string =>
  JSON.stringify(config).replace(/</g, '\\u003c');

const buildScript = (config: ManagementWebRuntimeConfig): string =>
  `globalThis.__METABOOST_MANAGEMENT_RUNTIME_CONFIG__ = ${serialize(config)};`;

export default function RuntimeConfigScript({
  runtimeConfig,
}: {
  runtimeConfig: ManagementWebRuntimeConfig;
}) {
  const script = buildScript(runtimeConfig);
  return (
    <Script id="metaboost-management-runtime-config" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
