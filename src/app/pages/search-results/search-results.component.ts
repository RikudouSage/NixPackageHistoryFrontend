import {Component, computed, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {Package, PackageManagerService} from "../../services/package-manager.service";
import {lastValueFrom} from "rxjs";
import {VersionComparatorService} from "../../services/version-comparator.service";
import {FormatNumberPipe} from '../../pipes/format-number.pipe';
import {LoaderComponent} from '../../components/loader/loader.component';
import {FormatDatetimePipe} from "../../pipes/format-datetime.pipe";

@Component({
    selector: 'app-search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss'],
    standalone: true,
  imports: [LoaderComponent, RouterLink, FormatNumberPipe, FormatDatetimePipe]
})
export class SearchResultsComponent implements OnInit {
  private readonly perPage = 50;

  public isTag = signal(false);
  public singlePackage = signal<string|null>(null);
  public search = signal<string|null>(null);
  public packageNames = signal<string[]>([]);
  public currentPage = signal(1);
  public currentPageResults = computed(() => {
    if (this.singlePackage()) {
      return [this.singlePackage()!];
    }
    return this.packageNames().slice(this.start(), this.end());
  });
  public start = signal(1);
  public end = signal(this.perPage);
  public loaded = signal(false);
  public maxPage = signal(1);

  public versions = signal<Package[]>([]);

  public openedPackage = signal<string|null>(null);

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly packageManager: PackageManagerService,
    private readonly router: Router,
    private readonly versionComparator: VersionComparatorService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.queryParams.subscribe(async queryParams => {
      this.loaded.set(false);
      this.singlePackage.set(queryParams['packageName'] ?? null);
      this.search.set(queryParams['search'] ?? null);
      this.currentPage.set(queryParams['page'] ? Number(queryParams['page']) : 1);

      if (this.singlePackage()) {
        if (this.singlePackage()!.endsWith('/tag')) {
          this.singlePackage.set(this.singlePackage()!.substring(0, this.singlePackage()!.length - 4));
          this.isTag.set(true);
        } else {
          this.isTag.set(false);
        }

        let detail: any[];
        if (this.isTag()) {
          detail = [await lastValueFrom(this.packageManager.getTag(this.singlePackage()!))].filter(item => item !== null);
        } else {
          detail = await lastValueFrom(this.packageManager.getPackage(this.singlePackage()!));
        }
        if (!detail.length) {
          this.search.set(this.singlePackage()!);
          this.singlePackage.set(null);
        } else {
          await this.openPackage(this.singlePackage()!);
        }
      }

      if (this.search()) {
        this.packageNames.set((await lastValueFrom(this.packageManager.getPackageNames()))
          .filter(packageName => packageName.toLowerCase().includes(this.search()!.toLowerCase()))
          .sort((a, b) => {
            if (a.toLowerCase().startsWith(this.search()!.toLowerCase()) && b.toLowerCase().startsWith(this.search()!.toLowerCase())) {
              return 0;
            }

            return a.toLowerCase().startsWith(this.search()!.toLowerCase()) ? -1 : 1;
          })
        );
        this.start.set(this.currentPage() * this.perPage - this.perPage);
        this.end.set(Math.min(this.currentPage() * this.perPage, this.packageNames().length));
        this.maxPage.set(Math.ceil(this.packageNames().length / this.perPage));
      }

      this.loaded.set(true);
    });
  }

  public async goToPage(page: number): Promise<void> {
    await this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {page: page},
      queryParamsHandling: 'merge',
    });
  }

  public async openPackage(packageName: string): Promise<void> {
    this.loaded.set(false);
    if (this.isTag()) {
      const tagDetail = (await lastValueFrom(this.packageManager.getTag(this.singlePackage()!)))!;
      const packageNames = tagDetail.packages;
      const promises: Promise<Package[]>[] = [];
      for (const name of packageNames) {
        promises.push(lastValueFrom(this.packageManager.getPackage(name)))
      }
      this.versions.set((await Promise.all(promises)).flat());
    } else {
      this.versions.set((await lastValueFrom(this.packageManager.getPackage(packageName))));
    }
    this.versions.update(versions => versions.sort((a, b) => this.versionComparator.compare(a.version, b.version)))
    this.openedPackage.set(packageName);
    this.loaded.set(true);
  }
}
