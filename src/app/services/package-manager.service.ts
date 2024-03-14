import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {from, Observable, of, switchMap, tap} from "rxjs";
import {environment} from "../../environments/environment";
import {CacheService} from "./cache.service";

export interface Tag {
  tag: string;
  packages: string[];
}


export interface Package {
  name: string;
  revision: string;
  version: string;
  datetime: string;
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
        tap(() => {
          this.cache.getItem<LatestRevision>('latest_revision', true).then(storedRevision => {
            this.getLatestRevision().subscribe(latestRevision => {
              if (
                storedRevision.value === undefined
                || storedRevision.value.datetime === null
                || latestRevision.datetime === null
                || new Date(storedRevision.value.datetime).getTime() < new Date(latestRevision.datetime).getTime()
              ) {
                this.getFreshPackageNames().subscribe(names => {
                  this.cache.storeCache('package_names', undefined, names).then(() => {
                    this.cache.storeCache('latest_revision', undefined, latestRevision);
                  });
                });
              }
            });
          });
        }),
        switchMap(cacheItem => {
          if (cacheItem.value === undefined) {
            return this.getFreshPackageNames().pipe(
              tap(names => {
                this.cache.storeCache('package_names', undefined, names);
              }),
              tap(() => {
                this.getLatestRevision().subscribe(revision => {
                  this.cache.storeCache('latest_revision', undefined, revision);
                })
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

  public getTags(): Observable<Tag[]> {
    return from(this.cache.getItem<Tag[]>('tags', true)).pipe(
      switchMap(cacheItem => {
        if (cacheItem.value === undefined) {
          return this.httpClient.get<Tag[]>(`${environment.apiUrl}/tags`).pipe(
            tap(tags => {
              const validUntil = new Date();
              validUntil.setTime(new Date().getTime() + 60 * 60 * 1_000);

              this.cache.storeCache('tags', validUntil, tags);
            }),
          );
        }

        return of(cacheItem.value);
      }),
    )
  }
}
