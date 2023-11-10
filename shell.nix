{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [
      nodejs_18
      nodePackages."@angular/cli"
      nodePackages.serverless
      yarn
      awscli
      jq
    ];
    shellHook = ''
      source <(ng completion script)
    '';
}
