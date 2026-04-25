import type { EmptyVal } from "./types";

export enum RedisClusterKey {
  Product = "product",
  ProductCrawl = "productCrawl",
  UserCrawl = "userCrawl",
  PaymentGateway = "paymentGateway",
  PlatformApiKeyBettamaxInternal = "platformApiKeyBettamaxInternal",
  PlatformSetting = "platformSetting",
  ExcludedPermissionIds = "excludedPermissionIds",
  EmbeddingImage = "embeddingImage",
  EmbeddingText = "embeddingText",
}

export const EMPTY_STRING_CACHE_VAL: EmptyVal = "EMPTY";
