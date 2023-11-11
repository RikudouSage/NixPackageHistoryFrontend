import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss'],
    standalone: true
})
export class ErrorComponent {
  @Input({required: true}) message: string = '';
}
