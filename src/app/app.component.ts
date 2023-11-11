import {Component, computed, OnInit, signal} from '@angular/core';
import {PackageManagerService} from "./services/package-manager.service";
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Router, RouterLink, RouterOutlet} from "@angular/router";
import {HttpErrorResponse} from "@angular/common/http";
import {FormatNumberPipe} from './pipes/format-number.pipe';
import {ErrorComponent} from './components/error/error.component';
import {NgFor, NgIf} from '@angular/common';
import {LoaderComponent} from './components/loader/loader.component';
import {toSignal} from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [LoaderComponent, NgIf, RouterLink, ReactiveFormsModule, NgFor, RouterOutlet, ErrorComponent, FormatNumberPipe]
})
export class AppComponent implements OnInit {
  public form = new FormGroup({
    packageName: new FormControl<string>('', [Validators.required]),
  });

  private currentPackageName = toSignal(this.form.controls.packageName.valueChanges, {initialValue: ''});

  // todo use toSignal once I find out how to handle the error
  public packageNames = signal<string[]>([]);
  public autocompleteHints = computed<string[]>(() => [...new Set(this.packageNames()
      .filter(item => item.toLowerCase().startsWith(this.currentPackageName()!.toLowerCase()))
      .concat(
          ...this.packageNames().filter(item => item.toLowerCase().includes(this.currentPackageName()!.toLowerCase()))
      )
      .slice(0, 100)
  )]);
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
          this.error.set('You have requested this resource too many times and have been rate limited.');
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
