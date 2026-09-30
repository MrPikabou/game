interface UploadInput {
  url?: string;
  buffer?: Buffer;
  base64?: string;
}

interface UploadResult {
  url?: string;
  mimeType: string | null;
  error?: string;
}

const FALLBACK_API_UPLOAD = 'https://api.create.xyz/v0/upload';

/**
 * Resolve the upload endpoint.
 *
 * Hit the API host (`NEXT_PUBLIC_CREATE_API_BASE_URL` + `/v0/upload`)
 * directly. That host is not behind Vercel bot protection, and it is not
 * subject to the published-app 4MB body cap.
 *
 * Do NOT call the platform marketing host (`NEXT_PUBLIC_CREATE_BASE_URL` /
 * create.xyz / anything.com + `/api/v0/upload`). That host sits behind Vercel
 * bot protection; server-side fetches cannot complete the challenge and get a
 * persistent HTTP 429 HTML "Vercel Security Checkpoint" page.
 *
 * Do NOT route via the published app origin (`APP_URL` + `/_create/api/upload/`).
 * That hop is capped at 4MB by Vercel.
 */
function resolveUploadEndpoint(): string {
  const apiBase = process.env.NEXT_PUBLIC_CREATE_API_BASE_URL?.replace(/\/$/, '');
  if (apiBase) {
    return `${apiBase}/v0/upload`;
  }
  return FALLBACK_API_UPLOAD;
}

async function upload({ url, buffer, base64 }: UploadInput): Promise<UploadResult> {
  const endpoint = resolveUploadEndpoint();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': buffer ? 'application/octet-stream' : 'application/json',
    },
    body: buffer ? new Uint8Array(buffer) : JSON.stringify({ base64, url }),
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    // Bot challenge / HTML error pages arrive as text/html with 429/403.
    return {
      mimeType: null,
      error: `Upload failed (${response.status}): non-JSON response from upload service`,
    };
  }

  const data = (await response.json()) as {
    url?: string;
    mimeType?: string | null;
    error?: string;
  };

  if (!response.ok) {
    return {
      mimeType: null,
      error: data.error ?? `Upload failed (${response.status}): ${JSON.stringify(data)}`,
    };
  }

  if (!data.url) {
    return {
      mimeType: null,
      error: data.error ?? 'Upload failed: missing url in response',
    };
  }

  return {
    url: data.url,
    mimeType: data.mimeType || null,
  };
}

export { upload };
export default upload;
