import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pseudoTags',
  standalone: true
})
export class PseudoTagsPipe implements PipeTransform {

  private readonly map: {[key: string]: string} = {
    '[s]': '<strong>',
    '[/s]': '</strong>'
  };

  transform(value: string): string {
    for (const pseudoTag of Object.keys(this.map)) {
      const htmlTag = this.map[pseudoTag];
      value = value.replaceAll(pseudoTag, htmlTag);
    }

    return value;
  }

}
