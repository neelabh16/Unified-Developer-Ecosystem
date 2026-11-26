const { API_URL } = require('./env');
const { SEED_PASSWORD } = require('./seed');

class ApiClient {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = null;
  }

  async request(method, path, { body, headers = {}, token } = {}) {
    const url = path.startsWith('http')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const authToken = token !== undefined ? token : this.token;
    const reqHeaders = { ...headers };

    let payload;
    if (body !== undefined && body !== null) {
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        payload = body;
      } else {
        reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
        payload = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    if (authToken) {
      reqHeaders.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: payload,
    });

    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      json,
    };
  }

  async login(identifier, password = SEED_PASSWORD) {
    const res = await this.request('POST', '/auth/login', {
      body: { identifier, password },
      headers: { Origin: new URL(this.baseUrl).origin },
    });
    if (!res.ok || !res.json?.data?.token) {
      throw new Error(
        `ApiClient login failed for ${identifier}: ${res.status} ${JSON.stringify(res.json)}`
      );
    }
    this.token = res.json.data.token;
    return res.json.data;
  }

  async register({ name, username, email, password = SEED_PASSWORD }) {
    const res = await this.request('POST', '/auth/register', {
      body: { name, username, email, password },
      headers: { Origin: new URL(this.baseUrl).origin },
    });
    if (res.ok && res.json?.data?.token) {
      this.token = res.json.data.token;
    }
    return res;
  }

  async getMe() {
    return this.request('GET', '/auth/me');
  }

  async getProjects(query = '') {
    return this.request('GET', `/projects${query ? `?${query}` : ''}`);
  }

  async createProject(payload) {
    return this.request('POST', '/projects', { body: payload });
  }

  async getHackathons() {
    return this.request('GET', '/hackathons');
  }

  async getCommunities() {
    return this.request('GET', '/communities');
  }

  async getCodexStatus() {
    return this.request('GET', '/codex/status');
  }

  async getActivityMe() {
    return this.request('GET', '/activity/me');
  }
}

module.exports = { ApiClient };
