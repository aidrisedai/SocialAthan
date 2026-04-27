export function getAppUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "https://athan-app.replit.app";
}

export function buildInviteShare(username: string | undefined) {
  const appUrl = getAppUrl();
  const handle = username ? `@${username}` : "";
  const message = handle
    ? `Assalamu alaykum! Join me on Athan, an app to coordinate jama'ah prayers. Add me as ${handle} after you sign up. ${appUrl}`
    : `Assalamu alaykum! Join me on Athan, an app to coordinate jama'ah prayers. ${appUrl}`;
  return { url: appUrl, message, handle };
}
