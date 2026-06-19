import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { OKTA_CONFIG, OktaAuthModule } from '@okta/okta-angular';
import OktaAuth from '@okta/okta-auth-js';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

const oktaAuth = new OktaAuth({
  issuer:      environment.okta.issuer,
  clientId:    environment.okta.clientId,
  redirectUri: environment.okta.redirectUri,
  scopes:      ['openid', 'profile', 'email'],
  pkce:        true,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    // Okta
    { provide: OKTA_CONFIG, useValue: { oktaAuth } },
    ...OktaAuthModule.forRoot().providers!,
  ],
};
