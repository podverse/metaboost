import { config } from '../../config/index.js';
import { AppRegistryService } from './AppRegistryService.js';

let instance: AppRegistryService | undefined;

export function getAppRegistryService(): AppRegistryService {
  if (instance === undefined) {
    instance = new AppRegistryService({
      registryBaseUrl: config.standardEndpointRegistryUrl,
      pollIntervalMs: config.standardEndpointRegistryPollSeconds * 1000,
      fetchTimeoutMs: config.standardEndpointRegistryTimeoutMs,
    });
  }
  return instance;
}

/** Test-only: replace registry service (e.g. mock fetch). Pass undefined to reset. */
export function setAppRegistryServiceForTests(service: AppRegistryService | undefined): void {
  instance = service ?? undefined;
}
