import {Component, input, Input} from '@angular/core';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss'],
    standalone: true
})
export class ErrorComponent {
  public message = input.required<string>();
}
