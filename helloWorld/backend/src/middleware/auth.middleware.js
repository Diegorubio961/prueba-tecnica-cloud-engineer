const jwt = require('jsonwebtoken');
const OktaJwtVerifier = require('@okta/jwt-verifier');

// Lazy-initialize the Okta verifier only if OKTA_ISSUER is configured
let oktaVerifier = null;
if (process.env.OKTA_ISSUER && process.env.OKTA_CLIENT_ID) {
  oktaVerifier = new OktaJwtVerifier({ issuer: process.env.OKTA_ISSUER });
}

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  // Decode header without verifying to detect the token issuer
  let decoded;
  try {
    decoded = jwt.decode(token, { complete: true });
  } catch {
    return res.status(401).json({ message: 'Token malformado' });
  }

  const issuer = decoded?.payload?.iss ?? '';
  const isOktaToken = oktaVerifier && issuer.includes('okta.com');

  if (isOktaToken) {
    // Verify with Okta's JWKS
    try {
      const jwt = await oktaVerifier.verifyAccessToken(token, process.env.OKTA_ISSUER);
      req.user = {
        id:    jwt.claims.sub,
        email: jwt.claims.email ?? jwt.claims.sub,
        name:  jwt.claims.name  ?? jwt.claims.email ?? jwt.claims.sub,
      };
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Token Okta inválido o expirado' });
    }
  }

  // Fall back to local JWT verification
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = authMiddleware;
