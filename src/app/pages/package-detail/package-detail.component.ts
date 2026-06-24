import {Component, DestroyRef, OnInit, signal} from '@angular/core';
import {Package, PackageManagerService} from "../../services/package-manager.service";
import {ActivatedRoute} from "@angular/router";
import {lastValueFrom, timer} from "rxjs";
import {LoaderComponent} from '../../components/loader/loader.component';
import {FormatDatetimePipe} from "../../pipes/format-datetime.pipe";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

interface PackageSnippets {
  flake: string;
  shell: string;
  configurationImport: string;
  configurationPackages: string;
}

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
  public copiedSnippet: string|null = null;
  public snippets: PackageSnippets|null = null;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly packageManager: PackageManagerService,
    private readonly destroyRef: DestroyRef,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      this.loaded.set(false);

      const packageName: string = params['packageName'];
      const packageVersion: string = params['packageVersion'];

      const packageDetail = await lastValueFrom(this.packageManager.getPackageVersion(packageName, packageVersion));
      this.packageDetail.set(packageDetail);
      this.snippets = this.createSnippets(packageDetail);

      this.loaded.set(true);
    });
  }

  public async copySnippet(snippetId: string, snippet: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      this.copySnippetWithTextarea(snippet);
    }

    this.copiedSnippet = snippetId;
    timer(2000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.copiedSnippet === snippetId) {
          this.copiedSnippet = null;
        }
      });
  }

  private createSnippets(packageDetail: Package): PackageSnippets {
    return {
      flake: `{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.customNixpkgs.url = "github:NixOS/nixpkgs/${packageDetail.revision}";

  outputs = { nixpkgs, customNixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
          custom = import customNixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            packages = [
              custom.${packageDetail.name}
            ];
          };
        });
    };
}`,
      shell: `{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages;
    let
      custom = import (builtins.fetchTarball https://github.com/nixos/nixpkgs/tarball/${packageDetail.revision}) {};
    in
    [
      custom.${packageDetail.name}
    ];
}`,
      configurationImport: `{ config, pkgs, ... }:
let
  custom = import (builtins.fetchTarball https://github.com/nixos/nixpkgs/tarball/${packageDetail.revision}) {
    config = config.nixpkgs.config;
  };
in
{`,
      configurationPackages: `environment.systemPackages = [
  custom.${packageDetail.name}
  pkgs.your-other-packages
];`,
    };
  }

  private copySnippetWithTextarea(snippet: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = snippet;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
