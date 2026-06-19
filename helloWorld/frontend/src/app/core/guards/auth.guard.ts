import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { from, map, switchMap, of } from 'rxjs';
import { OKTA_AUTH } from '@okta/okta-angular';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const oktaAuth = inject(OKTA_AUTH);
  const router = inject(Router);

  // Check local JWT first (fast path)
  if (auth.isAuthenticated()) return true;

  // Check Okta session (async)
  return from(oktaAuth.isAuthenticated()).pipe(
    map((isOkta) => isOkta || router.createUrlTree(['/login']))
  );
};
