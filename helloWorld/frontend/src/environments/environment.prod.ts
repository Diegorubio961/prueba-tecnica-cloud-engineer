export const environment = {
  production: true,
  apiUrl: '/api',
  okta: {
    // En producción estas variables se reemplazan en el build o via nginx
    // Los valores deben coincidir con los configurados en el panel de Okta
    issuer:      'https://dev-XXXXXXXX.okta.com/oauth2/default',
    clientId:    'your_okta_client_id_here',
    redirectUri: 'http://YOUR_EC2_IP/login/callback',
  },
};
