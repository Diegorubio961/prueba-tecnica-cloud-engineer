export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  okta: {
    issuer:      'https://dev-XXXXXXXX.okta.com/oauth2/default',
    clientId:    'your_okta_client_id_here',
    redirectUri: 'http://localhost:4200/login/callback',
  },
};
