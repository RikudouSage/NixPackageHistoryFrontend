import {importProvidersFrom} from '@angular/core';
import {AppComponent} from './app/app.component';
import {ReactiveFormsModule} from '@angular/forms';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {appRoutes} from './app/app-routing';
import {bootstrapApplication, BrowserModule} from '@angular/platform-browser';
import {provideRouter} from "@angular/router";


bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, ReactiveFormsModule),
        provideHttpClient(withInterceptorsFromDi()),
        provideRouter(appRoutes),
    ]
})
  .catch(err => console.error(err));
