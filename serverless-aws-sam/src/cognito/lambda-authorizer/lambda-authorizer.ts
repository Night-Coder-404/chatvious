import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { decomposeUnverifiedJwt } from "aws-jwt-verify/jwt";
import { TokenRefresh } from "../../types/types.js";

interface InputTokens {
  refresh_token?: string;
  access_token?: string;
  id_token?: string;
}

interface Tokens {
  refresh_token: string;
  access_token?: string;
  id_token?: string;
}

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  const methodArn = event.methodArn;

  const tokens = decomposeTokensString(event.authorizationToken);
  if ("error" in tokens) {
    return buildPolicy("Unauthorized", "Deny", methodArn);
  }

  // env's not set up yet. Make sure to do so
  const cognitoData = {
    USER_POOL_ID: process.env.USER_POOL_ID as string,
    CLIENT_ID: process.env.CLIENT_ID as string,
    COGNITO_DOMAIN: process.env.COGNITO_DOMAIN as string,
  };

  // just working with access token for now
  if ("access_token" in tokens) {
    const verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoData.USER_POOL_ID as string,
      tokenUse: "access",
      clientId: cognitoData.CLIENT_ID as string,
    });

    const access_token = tokens.access_token as string;
    try {
      const payload = await verifier.verify(access_token);

      const claims = {
        sub: payload.sub,
        username: payload.username,
        iss: payload.iss,
        client_id: payload.client_id,
        origin_jti: payload.origin_jti,
        event_id: payload.event_id,
        token_use: payload.token_use,
        auth_time: payload.auth_time,
        exp: payload.exp,
        iat: payload.iat,
        jti: payload.jti,
      };

      return buildPolicy(payload.sub, "Allow", methodArn, { claims });
    } catch (err) {
      return buildPolicy("Unauthorized", "Deny", methodArn);
    }
  } else {
    // refreshes tokens and passes them to lambdas to set as cookies
    const refresh_token = tokens.refresh_token as string;

    try {
      const tokenResponse = await fetch(
        `${cognitoData.COGNITO_DOMAIN}/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=refresh_token&client_id=jet3kkqp4jnkm1v3ta7htu75g&refresh_token=${refresh_token}`,
        }
      );

      if (!tokenResponse.ok) {
        return buildPolicy("Unauthorized", "Deny", methodArn);
      }
      const tokenData: TokenRefresh = await tokenResponse.json();
      const access_token = tokenData.access_token;
      const id_token = tokenData.id_token;

      const { payload } = decomposeUnverifiedJwt(access_token);

      const context = {
        claims: {
          sub: payload.sub,
          username: payload.username,
          iss: payload.iss,
          client_id: payload.client_id,
          origin_jti: payload.origin_jti,
          event_id: payload.event_id,
          token_use: payload.token_use,
          auth_time: payload.auth_time,
          exp: payload.exp,
          iat: payload.iat,
          jti: payload.jti,
        },
        access_token,
        id_token,
      };

      return buildPolicy(payload.sub as string, "Allow", methodArn, context);
    } catch (err) {
      return buildPolicy("Unauthorized", "Deny", methodArn);
    }
  }
};

function buildPolicy(
  principalId: string,
  effect: "Deny" | "Allow",
  methodArn: string,
  context?: {
    claims: any;
    scopes?: any;
    access_token?: string;
    id_token?: string;
  }
): APIGatewayAuthorizerResult {
  if (context) {
    return {
      principalId: principalId,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: methodArn,
          },
        ],
      },
      context: context,
    };
  } else {
    return {
      principalId: principalId,
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: effect,
            Resource: methodArn,
          },
        ],
      },
    };
  }
}

function decomposeTokensString(
  tokensString: string
): Tokens | { error: string } {
  try {
    const tokens: InputTokens = JSON.parse(tokensString);

    if (!("refresh_token" in tokens)) {
      return { error: "Missing refresh token" };
    }

    return tokens as Tokens;
  } catch (err) {
    return {
      error: "Invalid token format",
    };
  }
}
