import {Component, OnInit} from '@angular/core';
import {Package, PackageManagerService} from "../../services/package-manager.service";
import {ActivatedRoute} from "@angular/router";
import {lastValueFrom} from "rxjs";
import {NgIf} from '@angular/common';
import {LoaderComponent} from '../../components/loader/loader.component';

@Component({
    selector: 'app-package-detail',
    templateUrl: './package-detail.component.html',
    styleUrls: ['./package-detail.component.scss'],
    standalone: true,
    imports: [LoaderComponent, NgIf]
})
export class PackageDetailComponent implements OnInit {
  public loaded = false;
  public packageDetail: Package | null = null;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly packageManager: PackageManagerService,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      this.loaded = false;

      const packageName: string = params['packageName'];
      const packageVersion: string = params['packageVersion'];

      this.packageDetail = await lastValueFrom(this.packageManager.getPackageVersion(packageName, packageVersion));

      this.loaded = true;
    });
  }
}
