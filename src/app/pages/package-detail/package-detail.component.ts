import {Component, OnInit, signal} from '@angular/core';
import {Package, PackageManagerService} from "../../services/package-manager.service";
import {ActivatedRoute} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {LoaderComponent} from '../../components/loader/loader.component';
import {FormatDatetimePipe} from "../../pipes/format-datetime.pipe";

@Component({
    selector: 'app-package-detail',
    templateUrl: './package-detail.component.html',
    styleUrls: ['./package-detail.component.scss'],
    standalone: true,
  imports: [LoaderComponent, FormatDatetimePipe]
})
export class PackageDetailComponent implements OnInit {
  public loaded = signal(false);
  public packageDetail = signal<Package|null>(null);

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly packageManager: PackageManagerService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      this.loaded.set(false);

      const packageName: string = params['packageName'];
      const packageVersion: string = params['packageVersion'];

      this.packageDetail.set(await lastValueFrom(this.packageManager.getPackageVersion(packageName, packageVersion)));

      this.loaded.set(true);
    });
  }
}
