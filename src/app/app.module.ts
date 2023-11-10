import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {HttpClientModule} from "@angular/common/http";
import { LoaderComponent } from './components/loader/loader.component';
import {ReactiveFormsModule} from "@angular/forms";
import { FormatNumberPipe } from './pipes/format-number.pipe';
import { SearchResultsComponent } from './pages/search-results/search-results.component';
import { PackageDetailComponent } from './pages/package-detail/package-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    LoaderComponent,
    FormatNumberPipe,
    SearchResultsComponent,
    PackageDetailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
