import {Routes} from '@angular/router';

export const appRoutes: Routes = [
  {
    path: 'search',
    loadComponent: () => import('./pages/search-results/search-results.component').then(c => c.SearchResultsComponent),
  },
  {
    path: 'package/:packageName/:packageVersion',
    loadComponent: () => import('./pages/package-detail/package-detail.component').then(c => c.PackageDetailComponent),
  }
];
