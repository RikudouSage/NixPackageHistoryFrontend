import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionComparatorService {
  private readonly patchExtractRegex = /([0-9]+)([^0-9-]+)/;

  constructor() { }

  public compare(a: string, b: string): -1|0|1 {
    const [majorA, minorA, patchA, prereleaseA] = this.getParts(a);
    const [majorB, minorB, patchB, prereleaseB] = this.getParts(b);

    if (majorA !== majorB) {
      return Number(majorA) > Number(majorB) ? -1 : 1;
    }
    if (minorA !== minorB) {
      return Number(minorA) > Number(minorB) ? -1 : 1;
    }
    if (patchA !== patchB) {
      return Number(patchA) > Number(patchB) ? -1 : 1;
    }
    if (prereleaseA === null && prereleaseB !== null) {
      return -1;
    }
    if (prereleaseA !== null && prereleaseB === null) {
      return 1;
    }
    if (prereleaseA !== null && prereleaseB !== null) {
      const result = prereleaseA.localeCompare(prereleaseB);
      if (result === 0) {
        return 0;
      }
      if (result < 0) {
        return -1;
      }
      if (result > 0) {
        return 1;
      }
    }

    return 0;
  }

  private getParts(version: string): [string, string, string, string|null] {
    const parts = version.split(".", 3);
    if (!parts.length) {
      return ['0', '0', '0', null];
    }

    if (parts.length === 1) {
      return [parts[0], '0', '0', null];
    }
    if (parts.length === 2) {
      return [parts[0], parts[1], '0', null];
    }
    if (parts.length > 3) {
      parts[2] = parts.slice(2, parts.length - 1).join('.');
    }
    if (this.patchExtractRegex.test(parts[2])) {
      const matches = parts[2].match(this.patchExtractRegex)!;
      parts[2] = `${matches.at(1)}-${matches.at(2)}`;
    }
    const subparts = parts[2].split("-");

    return [parts[0], parts[1], subparts[0], subparts[1] ?? null];
  }
}

