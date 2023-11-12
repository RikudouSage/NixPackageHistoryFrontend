import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {debounceTime, from, map, Observable, of, switchMap, tap} from "rxjs";
import {environment} from "../../environments/environment";
import {CacheService} from "./cache.service";

export interface Package {
  name: string;
  revision: string;
  version: string;
}

export interface LatestRevision {
  datetime: string | null;
  revision: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PackageManagerService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly cache: CacheService,
  ) {}

  public getPackageNames(): Observable<string[]> {
    return from(this.cache.getItem<string[]>('package_names', false))
      .pipe(
        tap(cacheItem => {
          if (cacheItem.value === undefined || cacheItem.validUntil === undefined) {
            return;
          }

          if (cacheItem.validUntil.getTime() > new Date().getTime()) {
            return;
          }

          this.getFreshPackageNames().subscribe(names => {
            this.cache.storeCache('package_names', new Date(new Date().getTime() + 86_400_000), names);
          });
        }),
        switchMap(cacheItem => {
          if (cacheItem.value === undefined) {
            return this.getFreshPackageNames().pipe(
              tap(names => {
                this.cache.storeCache('package_names', new Date(new Date().getTime() + 86_400_000), names);
              }),
            );
          }

          return of(cacheItem.value);
        }),
      );

  }

  public getPackage(name: string): Observable<Package[]> {
    if (!name) {
      return of([]);
    }
    return this.httpClient.get<Package[]>(`${environment.apiUrl}/packages/${name}`);
  }

  public getPackageVersion(name: string, version: string): Observable<Package> {
    return this.httpClient.get<Package>(`${environment.apiUrl}/packages/${name}/${version}`);
  }

  private getFreshPackageNames(): Observable<string[]> {
    return this.httpClient.get<string[]>(`${environment.apiUrl}/packages`);
  }

  public getLatestRevision(): Observable<LatestRevision> {
    return this.httpClient.get<LatestRevision>(`${environment.apiUrl}/latest-revision`);
  }
}
