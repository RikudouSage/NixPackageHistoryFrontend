{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages;
    let
        sls = import (builtins.fetchTarball https://github.com/nixos/nixpkgs/tarball/667993862518f5a890747dfe7aba2c6d0c7787ce) {};
    in
    [
      nodejs_22
      nodePackages."@angular/cli"
      sls.nodePackages.serverless
      yarn
      awscli2
      jq
    ];
    shellHook = ''
      source <(ng completion script)
    '';
}
