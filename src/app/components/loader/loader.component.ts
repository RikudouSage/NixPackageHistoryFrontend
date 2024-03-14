import {Component, input, Input} from '@angular/core';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
    standalone: true
})
export class LoaderComponent {
  public message = input.required<string>();
}
