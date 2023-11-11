import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Package, PackageManagerService} from "./services/package-manager.service";
import {debounceTime, map, switchMap} from "rxjs";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {VersionComparatorService} from "./services/version-comparator.service";
import {Router, RouterLink, RouterOutlet} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";
import {FormatNumberPipe} from './pipes/format-number.pipe';
import {ErrorComponent} from './components/error/error.component';
import {NgFor, NgIf} from '@angular/common';
import {LoaderComponent} from './components/loader/loader.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [LoaderComponent, NgIf, RouterLink, ReactiveFormsModule, NgFor, RouterOutlet, ErrorComponent, FormatNumberPipe]
})
export class AppComponent implements OnInit {
  public packageNames: string[] = [];
  public form = new FormGroup({
    packageName: new FormControl<string>('', [Validators.required]),
  });
  public packages: Package[] = [];
  public autocompleteHints: string[] = [];
  public childDisplayed: boolean = false;
  public error: string = '';

  constructor(
    private readonly packageManager: PackageManagerService,
    private readonly versionComparator: VersionComparatorService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
  }

  public ngOnInit(): void {
    this.packageManager.getPackageNames().subscribe({
      next: packageNames => this.packageNames = packageNames,
      error: (error: HttpErrorResponse) => {
        if (error.status === 429) {
          const date = error.headers.get('Retry-After');
          this.error = 'You have requested this resource too many times and have been rate limited.'
          if (date) {
            const dateFormatted = new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }).format(new Date(date));
            this.error += ` Please try again after ${dateFormatted}.`;
          }
          return;
        }
        this.error = 'There was an error while trying to fetch the list of packages.';
      },
    });

    this.form.controls.packageName.valueChanges.subscribe(() => this.packages = []);
    this.form.controls.packageName.valueChanges.pipe(
      debounceTime(300),
      switchMap(packageName => this.packageManager.getPackage(packageName!)),
      map(packages => packages.sort((a, b) => this.versionComparator.compare(a.version, b.version))),
    ).subscribe(packages => this.packages = packages);
    this.form.controls.packageName.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(packageName => {
      this.autocompleteHints = [...new Set(this.packageNames
        .filter(item => item.toLowerCase().startsWith(packageName!.toLowerCase()))
        .concat(
          ...this.packageNames.filter(item => item.toLowerCase().includes(packageName!.toLowerCase()))
        )
        .slice(0, 100)
      )];
    });

  }

  public async goToPackage(packageName: string) {
    this.form.patchValue({packageName: packageName});
    await this.router.navigateByUrl(this.router.createUrlTree(['/search'], {
      queryParams: {
        packageName: packageName,
      }
    }));
  }

  public async childLoaded(): Promise<void> {
    this.childDisplayed = true;
    this.changeDetector.detectChanges();
  }

  public async search(): Promise<void> {
    await this.router.navigateByUrl(this.router.createUrlTree(['/search'], {
      queryParams: {
        search: this.form.controls.packageName.value!,
      }
    }));
  }
}
