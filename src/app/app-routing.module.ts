import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {SearchResultsComponent} from "./pages/search-results/search-results.component";
import {PackageDetailComponent} from "./pages/package-detail/package-detail.component";

const routes: Routes = [
  {
    path: 'search',
    component: SearchResultsComponent,
  },
  {
    path: 'package/:packageName/:packageVersion',
    component: PackageDetailComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
