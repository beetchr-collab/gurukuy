export const normalizeImageUrl = (value: string) => {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";

    if (
      url.hostname === "drive.google.com" ||
      url.hostname === "www.drive.google.com"
    ) {
      const fileId =
        url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ||
        url.searchParams.get("id");
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w2000`;
      }
    }

    if (url.hostname === "lh3.googleusercontent.com") {
      const fileId = url.pathname.match(/^\/d\/([^/=]+)/)?.[1];
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}=w2000`;
      }
    }

    return url.toString();
  } catch {
    return "";
  }
};
