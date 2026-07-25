import jwt from "jsonwebtoken";

function appJwt() {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iat: now - 60, exp: now + 570, iss: process.env.GITHUB_APP_ID },
    process.env.GITHUB_APP_PRIVATE_KEY,
    { algorithm: "RS256" }
  );
}

export async function getInstallationToken(installationId) {
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appJwt()}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  if (!res.ok) throw new Error("Failed to mint installation token");
  return (await res.json()).token;
}