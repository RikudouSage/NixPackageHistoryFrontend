import {Component, computed, OnInit, signal} from '@angular/core';
import {LatestRevision, PackageManagerService, Tag} from "./services/package-manager.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Router, RouterLink, RouterOutlet} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";
import {FormatNumberPipe} from './pipes/format-number.pipe';
import {ErrorComponent} from './components/error/error.component';
import {LoaderComponent} from './components/loader/loader.component';
import {toSignal} from "@angular/core/rxjs-interop";
import {FormatDatetimePipe} from "./pipes/format-datetime.pipe";
import {PseudoTagsPipe} from "./pipes/pseudo-tags.pipe";

interface AutocompleteHint {
  displayName: string;
  package: string;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
  imports: [LoaderComponent, RouterLink, ReactiveFormsModule, RouterOutlet, ErrorComponent, FormatNumberPipe, FormatDatetimePipe, PseudoTagsPipe]
})
export class AppComponent implements OnInit {
  public form = new FormGroup({
    packageName: new FormControl<string>('', [Validators.required]),
  });
  public latestRevision: LatestRevision | null = null;

  private currentPackageName = toSignal(this.form.controls.packageName.valueChanges, {initialValue: ''});

  // todo use toSignal once I find out how to handle the error
  public packageNames = signal<string[]>([]);
  public tags = signal<Tag[]>([]);
  public autocompleteHints = computed<AutocompleteHint[]>(() => {
    const currentSearch = this.currentPackageName()!.toLowerCase();

    const tagsStartsWith: AutocompleteHint[] = this.tags()
      .filter(tag => tag.tag.toLowerCase().startsWith(currentSearch))
      .map(tag => ({displayName: `[s]${tag.tag}[/s] (${tag.packages.join(', ')})`, package: `${tag.tag}/tag`}))
    ;
    const tagsContains: AutocompleteHint[] = this.tags()
      .filter(tag => tag.tag.toLowerCase().includes(currentSearch))
      .map(tag => ({displayName: `[s]${tag.tag}[/s] (${tag.packages.join(', ')})`, package: `${tag.tag}/tag`}))
    ;

    const packagesStartsWith: AutocompleteHint[] = this.packageNames()
      .filter(item => item.toLowerCase().startsWith(currentSearch))
      .map(item => ({displayName: item, package: item}))
    ;
    const packagesContains: AutocompleteHint[] = this.packageNames()
      .filter(item => item.toLowerCase().includes(currentSearch))
      .map(item => ({displayName: item, package: item}))
    ;

    return [...tagsStartsWith, ...packagesStartsWith, ...tagsContains, ...packagesContains].slice(0, 100).sort((a, b) => {
      const packageA = a.package.endsWith('/tag') ? a.package.substring(0, a.package.length - 4) : a.package;
      const packageB = b.package.endsWith('/tag') ? b.package.substring(0, b.package.length - 4) : b.package;
      if (packageA === packageB) {
        if (a.package.endsWith('/tag')) {
          return -1;
        } else if (b.package.endsWith('/tag')) {
          return 1;
        }
        if ((a.package.endsWith('/tag') && b.package.endsWith('/tag')) || !(a.package.endsWith('/tag') && b.package.endsWith('/tag'))) {
          return 0;
        }

        return a.package.endsWith('/tag') ? -1 : 1;
      }

      return packageA < packageB ? -1 : 1;
    });
  });
  public childDisplayed = signal(false);
  public error = signal('');

  constructor(
    private readonly packageManager: PackageManagerService,
    private readonly router: Router,
  ) {
  }

  public ngOnInit(): void {
    this.packageManager.getPackageNames().subscribe({
      next: packageNames => this.packageNames.set(packageNames),
      error: (error: HttpErrorResponse) => {
        if (error.status === 429) {
          const date = error.headers.get('Retry-After');
          this.error.set('You have requested the list of packages too many times and have been rate limited.');
          if (date) {
            const dateFormatted = new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }).format(new Date(date));
            this.error.set(`${this.error()} Please try again after ${dateFormatted}.`);
          }
          return;
        }
        this.error.set('There was an error while trying to fetch the list of packages.');
      },
    });
    this.packageManager.getTags().subscribe({
      next: tags => this.tags.set(tags),
      error: (error: HttpErrorResponse) => {
        if (error.status === 429) {
          const date = error.headers.get('Retry-After');
          this.error.set('You have requested the list of tags too many times and have been rate limited.');
          if (date) {
            const dateFormatted = new Intl.DateTimeFormat('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }).format(new Date(date));
            this.error.set(`${this.error()} Please try again after ${dateFormatted}.`);
          }
          return;
        }
        this.error.set('There was an error while trying to fetch the list of tags.');
      }
    })
    this.packageManager.getLatestRevision().subscribe(revision => this.latestRevision = revision);
  }

  public async goToPackage(packageName: string) {
    this.form.patchValue({packageName: packageName});
    await this.router.navigateByUrl(this.router.createUrlTree(['/search'], {
      queryParams: {
        packageName: packageName,
      }
    }));
  }

  public async search(): Promise<void> {
    await this.router.navigateByUrl(this.router.createUrlTree(['/search'], {
      queryParams: {
        search: this.form.controls.packageName.value!,
      }
    }));
  }
}
