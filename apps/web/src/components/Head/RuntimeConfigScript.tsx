import type { WebRuntimeConfig } from '../../config/runtime-config';

import Script from 'next/script';

const serialize = (config: WebRuntimeConfig): string =>
  JSON.stringify(config).replace(/</g, '\\u003c');

const buildScript = (config: WebRuntimeConfig): string =>
  `globalThis.__METABOOST_RUNTIME_CONFIG__ = ${serialize(config)};`;

export default function RuntimeConfigScript({
  runtimeConfig,
}: {
  runtimeConfig: WebRuntimeConfig;
}) {
  const script = buildScript(runtimeConfig);
  return (
    <Script id="metaboost-runtime-config" strategy="beforeInteractive">
      {script}
    </Script>
  );
}
