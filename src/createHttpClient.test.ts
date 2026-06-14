import { createHttpClient, type HttpServicePort } from './createHttpClient';

function makeHttp(): jest.Mocked<HttpServicePort> {
  const http: jest.Mocked<HttpServicePort> = {
    get: jest.fn(),
    post: jest.fn(),
    postForm: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    deleteMethod: jest.fn(),
  };
  http.get.mockResolvedValue('get' as never);
  http.post.mockResolvedValue('post' as never);
  http.postForm.mockResolvedValue('postForm' as never);
  http.put.mockResolvedValue('put' as never);
  http.patch.mockResolvedValue('patch' as never);
  http.deleteMethod.mockResolvedValue('delete' as never);
  return http;
}

describe('createHttpClient', () => {
  it('routes GET to httpService.get with params', async () => {
    const http = makeHttp();
    const client = createHttpClient(http, { baseURL: '/api' });
    const result = await client({ url: '/items', method: 'GET', params: { q: 1 } });

    expect(result).toBe('get');
    expect(http.get).toHaveBeenCalledWith('/items', { q: 1 }, {
      withCredentials: true,
      baseURL: '/api',
      signal: undefined,
      headers: undefined,
    });
  });

  it('defaults the method to GET when none is supplied', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    await client({ url: '/items' });
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('routes POST with a JSON body to httpService.post', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    const result = await client({ url: '/items', method: 'POST', data: { name: 'a' } });
    expect(result).toBe('post');
    expect(http.post).toHaveBeenCalledWith('/items', { name: 'a' }, expect.any(Object));
  });

  it('routes POST with FormData to httpService.postForm', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    const form = new FormData();
    const result = await client({ url: '/upload', method: 'POST', data: form });
    expect(result).toBe('postForm');
    expect(http.postForm).toHaveBeenCalledWith('/upload', form, expect.any(Object));
  });

  it('routes PUT to httpService.put and strips FormData', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    await client({ url: '/items/1', method: 'PUT', data: { x: 1 } });
    expect(http.put).toHaveBeenCalledWith('/items/1', { x: 1 }, expect.any(Object));

    await client({ url: '/items/1', method: 'PUT', data: new FormData() });
    expect(http.put).toHaveBeenLastCalledWith('/items/1', undefined, expect.any(Object));
  });

  it('routes PATCH to httpService.patch and strips FormData', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    await client({ url: '/items/1', method: 'PATCH', data: { x: 1 } });
    expect(http.patch).toHaveBeenCalledWith('/items/1', { x: 1 }, expect.any(Object));

    await client({ url: '/items/1', method: 'PATCH', data: new FormData() });
    expect(http.patch).toHaveBeenLastCalledWith('/items/1', undefined, expect.any(Object));
  });

  it('routes DELETE to httpService.deleteMethod and strips FormData', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    await client({ url: '/items/1', method: 'DELETE', data: { x: 1 } });
    expect(http.deleteMethod).toHaveBeenCalledWith('/items/1', { x: 1 }, expect.any(Object));

    await client({ url: '/items/1', method: 'DELETE', data: new FormData() });
    expect(http.deleteMethod).toHaveBeenLastCalledWith('/items/1', undefined, expect.any(Object));
  });

  it('falls back to POST for unsupported methods', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    const result = await client({ url: '/items', method: 'HEAD', data: { x: 1 } });
    expect(result).toBe('post');
    expect(http.post).toHaveBeenCalledWith('/items', { x: 1 }, expect.any(Object));
  });

  it('respects an explicit withCredentials=false override', async () => {
    const http = makeHttp();
    const client = createHttpClient(http, { withCredentials: false });
    await client({ url: '/x', method: 'GET' });
    expect(http.get).toHaveBeenCalledWith(
      '/x',
      undefined,
      expect.objectContaining({ withCredentials: false }),
    );
  });

  it('forwards signal and headers from the request', async () => {
    const http = makeHttp();
    const client = createHttpClient(http);
    const controller = new AbortController();
    await client({
      url: '/x',
      method: 'GET',
      signal: controller.signal,
      headers: { 'X-Test': '1' },
    });
    expect(http.get).toHaveBeenCalledWith(
      '/x',
      undefined,
      expect.objectContaining({
        signal: controller.signal,
        headers: { 'X-Test': '1' },
      }),
    );
  });
});
