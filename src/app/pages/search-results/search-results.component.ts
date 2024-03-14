import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {Package, PackageManagerService} from "../../services/package-manager.service";
import {lastValueFrom} from "rxjs";
import {VersionComparatorService} from "../../services/version-comparator.service";
import {FormatNumberPipe} from '../../pipes/format-number.pipe';
import {NgFor, NgIf} from '@angular/common';
import {LoaderComponent} from '../../components/loader/loader.component';
import {FormatDatetimePipe} from "../../pipes/format-datetime.pipe";

@Component({
    selector: 'app-search-results',
    templateUrl: './search-results.component.html',
    styleUrls: ['./search-results.component.scss'],
    standalone: true,
  imports: [LoaderComponent, NgIf, NgFor, RouterLink, FormatNumberPipe, FormatDatetimePipe]
})
export class SearchResultsComponent implements OnInit {
  private readonly perPage = 50;

  public isTag: boolean = false;
  public singlePackage: string | null = null;
  public search: string | null = null;
  public packageNames: string[] = [];
  public currentPage: number = 1;
  public currentPageResults: string[] = [];
  public start: number = 1;
  public end: number = this.perPage;
  public loaded: boolean = false;
  public maxPage = 1;

  public versions: Package[] = [];

  public openedPackage: string | null = null;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly packageManager: PackageManagerService,
    private readonly router: Router,
    private readonly versionComparator: VersionComparatorService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.queryParams.subscribe(async queryParams => {
      this.loaded = false;
      this.singlePackage = queryParams['packageName'] ?? null;
      this.search = queryParams['search'] ?? null;
      this.currentPage = queryParams['page'] ? Number(queryParams['page']) : 1;

      if (this.singlePackage) {
        if (this.singlePackage.endsWith('/tag')) {
          this.singlePackage = this.singlePackage.substring(0, this.singlePackage.length - 4);
          this.isTag = true;
        }

        let detail: any[];
        if (this.isTag) {
          detail = [await lastValueFrom(this.packageManager.getTag(this.singlePackage))].filter(item => item !== null);
        } else {
          detail = await lastValueFrom(this.packageManager.getPackage(this.singlePackage));
        }
        if (!detail.length) {
          this.search = this.singlePackage;
          this.singlePackage = null;
        } else {
          this.currentPageResults = [this.singlePackage];
          await this.openPackage(this.singlePackage);
        }
      }

      if (this.search) {
        this.packageNames = (await lastValueFrom(this.packageManager.getPackageNames()))
          .filter(packageName => packageName.toLowerCase().includes(this.search!.toLowerCase()))
          .sort((a, b) => {
            if (a.toLowerCase().startsWith(this.search!.toLowerCase()) && b.toLowerCase().startsWith(this.search!.toLowerCase())) {
              return 0;
            }

            return a.toLowerCase().startsWith(this.search!.toLowerCase()) ? -1 : 1;
          })
        ;
        this.start = this.currentPage * this.perPage - this.perPage;
        this.end = Math.min(this.currentPage * this.perPage, this.packageNames.length);
        this.currentPageResults = this.packageNames.slice(this.start, this.end);
        this.maxPage = Math.ceil(this.packageNames.length / this.perPage);
      }

      this.loaded = true;
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
    this.loaded = false;
    if (this.isTag) {
      const tagDetail = (await lastValueFrom(this.packageManager.getTag(this.singlePackage!)))!
      const packageNames = tagDetail.packages;
      const promises: Promise<Package[]>[] = [];
      for (const name of packageNames) {
        promises.push(lastValueFrom(this.packageManager.getPackage(name)))
      }
      this.versions = (await Promise.all(promises)).flat();
    } else {
      this.versions = (await lastValueFrom(this.packageManager.getPackage(packageName)));
    }
    this.versions = this.versions.sort((a, b) => this.versionComparator.compare(a.version, b.version));
    this.openedPackage = packageName;
    this.loaded = true;
  }
}
