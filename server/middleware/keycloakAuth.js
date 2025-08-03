import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { AppError } from "./errorHandler.js";

// Keycloak configuration
const KEYCLOAK_CONFIG = {
  realm: process.env.KEYCLOAK_REALM || "master",
  authServerUrl:
    process.env.KEYCLOAK_AUTH_SERVER_URL || "http://localhost:8080",
  clientId: process.env.KEYCLOAK_CLIENT_ID || "admin-client",
  publicKey: process.env.KEYCLOAK_PUBLIC_KEY || null,
};

// JWKS client for fetching public keys
const client = jwksClient({
  jwksUri: `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Get signing key from JWKS
const getSigningKey = async (kid) => {
  try {
    const key = await client.getSigningKey(kid);
    return key.getPublicKey();
  } catch (error) {
    console.error("❌ [KEYCLOAK] Failed to get signing key:", error);
    throw new AppError("Invalid token signature", 401);
  }
};

// Verify Keycloak JWT token
export const verifyKeycloakToken = async (token) => {
  try {
    // Decode token header to get key ID
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new AppError("Invalid token format", 401);
    }

    const { kid } = decoded.header;
    if (!kid) {
      throw new AppError("Token missing key ID", 401);
    }

    // Get the signing key
    const signingKey = await getSigningKey(kid);

    // Verify the token
    const verified = jwt.verify(token, signingKey, {
      algorithms: ["RS256"],
      issuer: `${KEYCLOAK_CONFIG.authServerUrl}/realms/${KEYCLOAK_CONFIG.realm}`,
      audience: KEYCLOAK_CONFIG.clientId,
    });

    return verified;
  } catch (error) {
    console.error("❌ [KEYCLOAK] Token verification failed:", error.message);
    throw new AppError("Invalid or expired token", 401);
  }
};

// Extract user information from Keycloak token
export const extractUserInfo = (decodedToken) => {
  return {
    userId: decodedToken.sub, // Keycloak user ID
    username: decodedToken.preferred_username || decodedToken.username,
    email: decodedToken.email,
    firstName: decodedToken.given_name,
    lastName: decodedToken.family_name,
    realmAccess: decodedToken.realm_access?.roles || [],
    resourceAccess: decodedToken.resource_access || {},
    groups: decodedToken.groups || [],
    emailVerified: decodedToken.email_verified || false,
  };
};

// Keycloak authentication middleware
export const keycloakAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization header missing or invalid", 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify the Keycloak token
    const decodedToken = await verifyKeycloakToken(token);

    // Extract user information
    const userInfo = extractUserInfo(decodedToken);

    // Add user info to request
    req.user = userInfo;
    req.keycloakToken = decodedToken;

    console.log("✅ [KEYCLOAK] User authenticated:", userInfo.username);
    next();
  } catch (error) {
    console.error("❌ [KEYCLOAK] Authentication failed:", error.message);
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
};

// Optional Keycloak authentication (doesn't fail if no token)
export const optionalKeycloakAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token provided, continue without authentication
      req.user = null;
      req.keycloakToken = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyKeycloakToken(token);
    const userInfo = extractUserInfo(decodedToken);

    req.user = userInfo;
    req.keycloakToken = decodedToken;

    console.log("✅ [KEYCLOAK] Optional auth successful:", userInfo.username);
    next();
  } catch (error) {
    console.error("❌ [KEYCLOAK] Optional auth failed:", error.message);
    // Continue without authentication
    req.user = null;
    req.keycloakToken = null;
    next();
  }
};

// Check if user has specific role
export const hasRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRoles = req.user.realmAccess || [];
    if (!userRoles.includes(requiredRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${requiredRole}`,
      });
    }

    next();
  };
};

// Check if user has any of the required roles
export const hasAnyRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRoles = req.user.realmAccess || [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${requiredRoles.join(", ")}`,
      });
    }

    next();
  };
};

export default {
  keycloakAuth,
  optionalKeycloakAuth,
  hasRole,
  hasAnyRole,
  verifyKeycloakToken,
  extractUserInfo,
};
