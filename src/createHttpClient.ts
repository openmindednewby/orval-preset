import type { OrvalRequest, OrvalMutator } from './mutators/registry';

export type { OrvalRequest, OrvalMutator };

/**
 * Request options passed to the injected httpService methods.
 *
 * This is the contract the consuming app's `httpService` must accept. The
 * package never imports a concrete axios/http layer — the app supplies it as
 * a port (see `HttpServicePort`), keeping this factory product-agnostic.
 */
export interface HttpRequestOptions {
  withCredentials?: boolean;
  baseURL?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/**
 * The HTTP transport port the consuming app injects. Mirrors the method
 * surface the app's `httpService` already exposes (axios bridge).
 *
 * The package always supplies the base {@link HttpRequestOptions} shape, so an
 * app whose `httpService` accepts a *wider* options type (extra optional fields)
 * can be adapted to this port without type assertions.
 */
export interface HttpServicePort {
  get<TQry, TResp>(endpoint: string, params: TQry, opts: HttpRequestOptions): Promise<TResp>;
  post<TReq, TResp>(endpoint: string, data: TReq, opts: HttpRequestOptions): Promise<TResp>;
  postForm<TResp>(endpoint: string, data: FormData, opts: HttpRequestOptions): Promise<TResp>;
  put<TReq, TResp>(endpoint: string, data: TReq, opts: HttpRequestOptions): Promise<TResp>;
  patch<TReq, TResp>(endpoint: string, data: TReq, opts: HttpRequestOptions): Promise<TResp>;
  deleteMethod<TReq, TResp>(endpoint: string, data: TReq, opts: HttpRequestOptions): Promise<TResp>;
}

interface HttpClientOptions {
  baseURL?: string;
  withCredentials?: boolean;
}

/**
 * Creates request options with common defaults.
 *
 * `withCredentials` is always on — the BFF session cookie must travel with
 * every same-origin API call. There is no `withToken`: the SPA holds no
 * token, the BFF attaches the `Bearer` server-side.
 */
function createRequestOptions(
  opts: OrvalRequest,
  clientOptions: HttpClientOptions,
): HttpRequestOptions {
  return {
    withCredentials: clientOptions.withCredentials ?? true,
    baseURL: clientOptions.baseURL,
    signal: opts.signal,
    headers: opts.headers,
  };
}

/**
 * Handles GET requests.
 */
async function handleGet<TResp, TQry>(
  http: HttpServicePort,
  endpoint: string,
  params: TQry,
  reqOpts: HttpRequestOptions,
): Promise<TResp> {
  return http.get<TQry, TResp>(endpoint, params, reqOpts);
}

/**
 * Handles POST requests, including FormData.
 */
async function handlePost<TResp, TReq>(
  http: HttpServicePort,
  endpoint: string,
  data: TReq | FormData | undefined,
  reqOpts: HttpRequestOptions,
): Promise<TResp> {
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return http.postForm<TResp>(endpoint, data, reqOpts);
  }

  // FormData was handled above, so `data` is TReq | undefined here. We cast
  // rather than re-test (the re-test would be a dead, uncoverable branch).
  const payload = data as TReq | undefined;
  return http.post<TReq | undefined, TResp>(endpoint, payload, reqOpts);
}

/**
 * Handles PUT requests.
 */
async function handlePut<TResp, TReq>(
  http: HttpServicePort,
  endpoint: string,
  data: TReq | undefined,
  reqOpts: HttpRequestOptions,
): Promise<TResp> {
  return http.put<TReq | undefined, TResp>(endpoint, data, reqOpts);
}

/**
 * Handles PATCH requests.
 */
async function handlePatch<TResp, TReq>(
  http: HttpServicePort,
  endpoint: string,
  data: TReq | undefined,
  reqOpts: HttpRequestOptions,
): Promise<TResp> {
  return http.patch<TReq | undefined, TResp>(endpoint, data, reqOpts);
}

/**
 * Handles DELETE requests.
 */
async function handleDelete<TResp, TReq>(
  http: HttpServicePort,
  endpoint: string,
  data: TReq | undefined,
  reqOpts: HttpRequestOptions,
): Promise<TResp> {
  return http.deleteMethod<TReq | undefined, TResp>(endpoint, data, reqOpts);
}

/**
 * Creates an HTTP client instance for Orval-generated hooks.
 *
 * @param http - The app's httpService transport (injected port).
 * @param clientOptions - Configuration options for the client (baseURL, auth settings).
 * @returns An async function that handles HTTP requests.
 */
export function createHttpClient(
  http: HttpServicePort,
  clientOptions: HttpClientOptions = {},
): OrvalMutator {
  return async <TResp = unknown, TReq = unknown, TQry = unknown>(
    opts: OrvalRequest<TReq, TQry>,
  ): Promise<TResp> => {
    const { url, method = 'GET', data, params } = opts;
    const m = method.toUpperCase();
    const endpoint = url;
    const reqOpts = createRequestOptions(opts, clientOptions);

    if (m === 'GET') {
      return handleGet<TResp, TQry | undefined>(http, endpoint, params, reqOpts);
    }

    if (m === 'POST') {
      return handlePost<TResp, TReq>(http, endpoint, data, reqOpts);
    }

    if (m === 'PUT') {
      // data could be TReq | FormData | undefined, but PUT doesn't use FormData
      const putData: TReq | undefined = data instanceof FormData ? undefined : data;
      return handlePut<TResp, TReq>(http, endpoint, putData, reqOpts);
    }

    if (m === 'PATCH') {
      const patchData: TReq | undefined = data instanceof FormData ? undefined : data;
      return handlePatch<TResp, TReq>(http, endpoint, patchData, reqOpts);
    }

    if (m === 'DELETE') {
      const deleteData: TReq | undefined = data instanceof FormData ? undefined : data;
      return handleDelete<TResp, TReq>(http, endpoint, deleteData, reqOpts);
    }

    // Fallback to POST for unsupported methods
    return handlePost<TResp, TReq>(http, endpoint, data, reqOpts);
  };
}
