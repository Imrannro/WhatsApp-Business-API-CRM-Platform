import {
  SalesforceTokenResponse,
  SalesforceIdentity,
  SalesforceQueryResult,
  SalesforceDescribeResult,
} from './types';
import { dbStore } from '../db/store';

export class SalesforceClient {
  private instanceUrl: string;
  private accessToken: string;
  private apiVersion = 'v60.0';

  constructor(instanceUrl?: string, accessToken?: string) {
    this.instanceUrl = (instanceUrl || process.env.SALESFORCE_INSTANCE_URL || '').replace(/\/$/, '');
    this.accessToken = accessToken || '';
  }

  public setCredentials(instanceUrl: string, accessToken: string) {
    this.instanceUrl = instanceUrl.replace(/\/$/, '');
    this.accessToken = accessToken;
  }

  public static getLoginBaseUrl(environment: 'production' | 'sandbox' = 'production'): string {
    return environment === 'sandbox'
      ? 'https://test.salesforce.com'
      : 'https://login.salesforce.com';
  }

  public static getAuthorizationUrl(params: {
    clientId: string;
    redirectUri: string;
    environment?: 'production' | 'sandbox';
    state?: string;
    scope?: string;
  }): string {
    const baseUrl = this.getLoginBaseUrl(params.environment);
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: params.clientId,
      redirect_uri: params.redirectUri,
      scope: params.scope || 'api refresh_token offline_access id profile',
      state: params.state || 'salesforce-oauth-state',
      prompt: 'consent',
    });
    return `${baseUrl}/services/oauth2/authorize?${query.toString()}`;
  }

  public static async exchangeCodeForToken(params: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    environment?: 'production' | 'sandbox';
  }): Promise<SalesforceTokenResponse> {
    const baseUrl = this.getLoginBaseUrl(params.environment);
    const tokenUrl = `${baseUrl}/services/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      redirect_uri: params.redirectUri,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.error_description || data.error || response.statusText;
      throw new Error(`Salesforce OAuth token exchange failed: ${errorMsg}`);
    }

    return data as SalesforceTokenResponse;
  }

  public static async refreshToken(params: {
    refreshToken: string;
    clientId: string;
    clientSecret: string;
    environment?: 'production' | 'sandbox';
  }): Promise<SalesforceTokenResponse> {
    const baseUrl = this.getLoginBaseUrl(params.environment);
    const tokenUrl = `${baseUrl}/services/oauth2/token`;

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: params.refreshToken,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.error_description || data.error || response.statusText;
      throw new Error(`Salesforce token refresh failed: ${errorMsg}`);
    }

    return data as SalesforceTokenResponse;
  }

  public static async getIdentity(
    identityUrl: string,
    accessToken: string
  ): Promise<SalesforceIdentity> {
    const response = await fetch(identityUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Failed to fetch Salesforce user identity: ${data.message || response.statusText}`);
    }

    return data as SalesforceIdentity;
  }

  public static async revokeToken(params: {
    token: string;
    environment?: 'production' | 'sandbox';
  }): Promise<boolean> {
    const baseUrl = this.getLoginBaseUrl(params.environment);
    const revokeUrl = `${baseUrl}/services/oauth2/revoke`;

    const body = new URLSearchParams({
      token: params.token,
    });

    const response = await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    return response.ok;
  }

  /**
   * Internal request handler with auto-token-refresh fallback on 401
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    if (!this.instanceUrl || !this.accessToken) {
      // Check if integration credentials exist in dbStore
      const integ = await dbStore.getSalesforceIntegration();
      if (integ && integ.status === 'CONNECTED') {
        this.instanceUrl = integ.instanceUrl;
        this.accessToken = integ.accessToken;
      } else {
        throw new Error('Salesforce is not connected. Please authenticate with Salesforce OAuth first.');
      }
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.instanceUrl}/services/data/${this.apiVersion}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized by attempting a token refresh
    if (response.status === 401 && !isRetry) {
      const refreshed = await this.attemptTokenRefresh();
      if (refreshed) {
        return this.request<T>(endpoint, options, true);
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMessage = response.statusText;
      if (Array.isArray(data) && data[0]?.message) {
        errorMessage = data[0].message;
      } else if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error_description) {
        errorMessage = data.error_description;
      }
      throw new Error(`Salesforce API error (${response.status}): ${errorMessage}`);
    }

    return data as T;
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    const integ = await dbStore.getSalesforceIntegration();
    if (!integ || !integ.refreshToken || !integ.clientId || !integ.clientSecret) {
      await dbStore.updateSalesforceStatus('ERROR', 'Session expired. Missing credentials for automatic token refresh.');
      return false;
    }

    try {
      const refreshResult = await SalesforceClient.refreshToken({
        refreshToken: integ.refreshToken,
        clientId: integ.clientId,
        clientSecret: integ.clientSecret,
        environment: integ.environment,
      });

      this.accessToken = refreshResult.access_token;
      if (refreshResult.instance_url) {
        this.instanceUrl = refreshResult.instance_url;
      }

      await dbStore.saveSalesforceIntegration({
        instanceUrl: this.instanceUrl,
        accessToken: this.accessToken,
        refreshToken: refreshResult.refresh_token || integ.refreshToken,
        status: 'CONNECTED',
        lastError: null,
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await dbStore.updateSalesforceStatus('ERROR', `Auto-refresh failed: ${message}`);
      return false;
    }
  }

  // --- SOQL Queries ---
  public async query<T>(soql: string): Promise<SalesforceQueryResult<T>> {
    const encodedQuery = encodeURIComponent(soql);
    return this.request<SalesforceQueryResult<T>>(`/query?q=${encodedQuery}`, {
      method: 'GET',
    });
  }

  // --- SObject Operations ---
  public async getSObject<T>(sobject: string, id: string): Promise<T> {
    return this.request<T>(`/sobjects/${sobject}/${id}`, {
      method: 'GET',
    });
  }

  public async createSObject(
    sobject: string,
    data: Record<string, unknown>
  ): Promise<{ id: string; success: boolean; errors: unknown[] }> {
    return this.request<{ id: string; success: boolean; errors: unknown[] }>(
      `/sobjects/${sobject}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  public async updateSObject(
    sobject: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.request<void>(`/sobjects/${sobject}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async deleteSObject(sobject: string, id: string): Promise<void> {
    await this.request<void>(`/sobjects/${sobject}/${id}`, {
      method: 'DELETE',
    });
  }

  public async describeSObject(sobject: string): Promise<SalesforceDescribeResult> {
    return this.request<SalesforceDescribeResult>(`/sobjects/${sobject}/describe`, {
      method: 'GET',
    });
  }
}

// Global default client
export const sfClient = new SalesforceClient();
