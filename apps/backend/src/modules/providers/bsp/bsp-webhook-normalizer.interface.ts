import type { ProviderWebhookEvent } from "../../../common/types";

export interface BspWebhookNormalizer {
  canHandle(payload: unknown): boolean;
  normalize(payload: unknown): ProviderWebhookEvent[];
}
