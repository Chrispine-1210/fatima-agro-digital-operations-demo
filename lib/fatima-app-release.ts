/** Updated only after a signed Android package has passed build/signature verification. */
export const androidRelease: {
  version: string;
  url: string;
  sha256: string;
  bytes: number;
} | null = {
  version: "1.0.0",
  url: "/downloads/fatima-agro-1.0.0.apk",
  sha256: "f88e32aa466577b95f023400ba0ab782703356daddf9705e0312fd7af1fff898",
  bytes: 3886335,
};
