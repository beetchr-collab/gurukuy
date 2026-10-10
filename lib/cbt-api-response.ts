type CbtApiResult = {
  success: boolean;
  message?: string;
};

export async function parseCbtApiResponse<T extends CbtApiResult>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  const isJson =
    contentType.includes("application/json") || contentType.includes("+json");
  const endpoint = response.url ? new URL(response.url).pathname : "endpoint CBT";
  const status = `${response.status} ${response.statusText}`.trim();

  if (!isJson) {
    const hint =
      response.status >= 500
        ? " Periksa Function Logs Vercel dan pastikan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, serta FIREBASE_PRIVATE_KEY tersedia pada Environment Variables."
        : " Pastikan route tersedia pada deployment Vercel dan periksa Function Logs.";
    throw new Error(
      `API ${endpoint} mengembalikan respons non-JSON (HTTP ${status}, ${contentType || "Content-Type tidak tersedia"}).${hint}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      `API ${endpoint} mengembalikan JSON yang tidak valid (HTTP ${status}). Periksa Function Logs Vercel.`,
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("success" in payload) ||
    typeof payload.success !== "boolean"
  ) {
    throw new Error(
      `Respons API ${endpoint} tidak memiliki format yang valid (HTTP ${status}).`,
    );
  }

  const result = payload as T;
  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result;
}
