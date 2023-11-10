import { Injectable } from '@angular/core';
import {DatabaseService} from "./database.service";

interface PartiallyDeserializedCacheItem<T> {
  key: string;
  validUntil: string | undefined;
  value: T | undefined;
}

export interface CacheItem<T> {
  key: string;
  validUntil: Date | undefined;
  value: T | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  constructor(
    private readonly database: DatabaseService,
  ) { }

  public async storeCache<T>(key: string, validUntil: Date, value: T): Promise<CacheItem<T>> {
    const item: CacheItem<T> = {
      key: key,
      validUntil: validUntil,
      value: value,
    };

    await this.database.setItem(`cache.${key}`, JSON.stringify(item));

    return item;
  }

  public async getItem<T>(key: string, validOnly: boolean): Promise<CacheItem<T>> {
    const result = await this.database.getItem(`cache.${key}`);
    if (result === null) {
      return {
        key: key,
        validUntil: undefined,
        value: undefined,
      };
    }

    const deserialized: PartiallyDeserializedCacheItem<T> = JSON.parse(result);
    const item: CacheItem<T> = {
      key: deserialized.key,
      validUntil: deserialized.validUntil ? new Date(deserialized.validUntil) : undefined,
      value: deserialized.value,
    };
    if (item.validUntil!.getTime() < new Date().getTime() && validOnly) {
      return {
        key: key,
        validUntil: undefined,
        value: undefined,
      };
    }

    return item;
  }
}
