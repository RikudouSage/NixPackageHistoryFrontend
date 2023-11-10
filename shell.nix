{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [
      nodejs_18
      nodePackages."@angular/cli"
      yarn
    ];
    shellHook = ''
      source <(ng completion script)
    '';
}
