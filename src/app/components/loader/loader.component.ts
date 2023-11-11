import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-loader',
    templateUrl: './loader.component.html',
    styleUrls: ['./loader.component.scss'],
    standalone: true
})
export class LoaderComponent {
  @Input({required: true}) message: string = '';
}
