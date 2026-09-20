import { Request, Response } from 'express';
import { dbStore } from '../../../lib/db/store';
import { SalesforceClient, sfClient } from '../../../lib/salesforce/client';
import { SalesforceSyncService } from '../../../lib/salesforce/service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class SalesforceController {
  /**
   * GET /api/salesforce/status
   */
  public static async getStatus(_req: Request, res: Response): Promise<void> {
    const integration = await dbStore.getSalesforceIntegration();
    const mappings = await dbStore.getFieldMappings();
    const recentLogs = await dbStore.getSalesforceSyncLogs(5);

    res.status(200).json({
      success: true,
      data: {
        integration: integration
          ? {
              id: integration.id,
              instanceUrl: integration.instanceUrl,
              tokenType: integration.tokenType,
              environment: integration.environment,
              userId: integration.userId,
              orgId: integration.orgId,
              userEmail: integration.userEmail,
              userName: integration.userName,
              autoSyncMessages: integration.autoSyncMessages,
              autoSyncContacts: integration.autoSyncContacts,
              targetObject: integration.targetObject,
              status: integration.status,
              lastSyncAt: integration.lastSyncAt,
              lastError: integration.lastError,
              hasRefreshToken: Boolean(integration.refreshToken),
              createdAt: integration.createdAt,
              updatedAt: integration.updatedAt,
            }
          : null,
        mappingsCount: mappings.length,
        recentLogs,
      },
    });
  }

  /**
   * GET /api/salesforce/auth-url
   */
  public static async getAuthUrl(req: Request, res: Response): Promise<void> {
    const clientId = (req.query.clientId as string) || process.env.SALESFORCE_CLIENT_ID;
    const redirectUri =
      (req.query.redirectUri as string) ||
      process.env.SALESFORCE_REDIRECT_URI ||
      'http://localhost:3000/api/salesforce/oauth/callback';
    const environment =
      ((req.query.environment as string) as 'production' | 'sandbox') ||
      (process.env.SALESFORCE_ENVIRONMENT as 'production' | 'sandbox') ||
      'production';

    if (!clientId) {
      res.status(400).json({
        success: false,
        error: 'Salesforce Client ID is required. Please provide it or configure SALESFORCE_CLIENT_ID.',
      });
      return;
    }

    const authUrl = SalesforceClient.getAuthorizationUrl({
      clientId,
      redirectUri,
      environment,
      state: `sf_state_${Date.now()}`,
    });

    res.status(200).json({
      success: true,
      authUrl,
      clientId,
      redirectUri,
      environment,
    });
  }

  /**
   * POST /api/salesforce/oauth/callback
   */
  public static async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    const { code, clientId, clientSecret, redirectUri, environment } = req.body;

    const actualClientId = clientId || process.env.SALESFORCE_CLIENT_ID;
    const actualClientSecret = clientSecret || process.env.SALESFORCE_CLIENT_SECRET;
    const actualRedirectUri =
      redirectUri ||
      process.env.SALESFORCE_REDIRECT_URI ||
      'http://localhost:3000/api/salesforce/oauth/callback';
    const actualEnv = environment || process.env.SALESFORCE_ENVIRONMENT || 'production';

    if (!code) {
      res.status(400).json({ success: false, error: 'Authorization code is required' });
      return;
    }

    if (!actualClientId || !actualClientSecret) {
      res.status(400).json({
        success: false,
        error: 'Salesforce Client ID and Client Secret are required for token exchange.',
      });
      return;
    }

    try {
      const tokenResponse = await SalesforceClient.exchangeCodeForToken({
        code,
        clientId: actualClientId,
        clientSecret: actualClientSecret,
        redirectUri: actualRedirectUri,
        environment: actualEnv,
      });

      let identityData = null;
      if (tokenResponse.id) {
        try {
          identityData = await SalesforceClient.getIdentity(
            tokenResponse.id,
            tokenResponse.access_token
          );
        } catch (identErr) {
          console.warn('[Salesforce Identity warning]', identErr);
        }
      }

      const integration = await dbStore.saveSalesforceIntegration({
        instanceUrl: tokenResponse.instance_url,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenType: tokenResponse.token_type || 'Bearer',
        issuedAt: tokenResponse.issued_at,
        environment: actualEnv,
        clientId: actualClientId,
        clientSecret: actualClientSecret,
        userId: identityData?.user_id,
        orgId: identityData?.organization_id,
        userEmail: identityData?.email,
        userName: identityData?.display_name || identityData?.username,
        status: 'CONNECTED',
        lastError: null,
      });

      sfClient.setCredentials(tokenResponse.instance_url, tokenResponse.access_token);

      res.status(200).json({
        success: true,
        message: 'Salesforce connected successfully via OAuth 2.0',
        data: {
          instanceUrl: integration.instanceUrl,
          orgId: integration.orgId,
          userName: integration.userName,
          userEmail: integration.userEmail,
          status: integration.status,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }

  /**
   * POST /api/salesforce/connect-direct
   */
  public static async connectDirect(req: AuthenticatedRequest, res: Response): Promise<void> {
    const {
      instanceUrl,
      accessToken,
      refreshToken,
      environment,
      clientId,
      clientSecret,
      targetObject,
      autoSyncMessages,
      autoSyncContacts,
    } = req.body;

    if (!instanceUrl || !accessToken) {
      res.status(400).json({
        success: false,
        error: 'Both instanceUrl and accessToken are required for direct connection.',
      });
      return;
    }

    try {
      sfClient.setCredentials(instanceUrl, accessToken);

      // Verify connection by running a lightweight SOQL query
      const testResult = await sfClient.query<{ Id: string }>('SELECT Id FROM Organization LIMIT 1');
      const orgId = testResult.records?.[0]?.Id || null;

      const integration = await dbStore.saveSalesforceIntegration({
        instanceUrl,
        accessToken,
        refreshToken: refreshToken || null,
        environment: environment || 'production',
        clientId: clientId || null,
        clientSecret: clientSecret || null,
        orgId,
        userName: 'Admin User',
        targetObject: targetObject || 'Contact',
        autoSyncMessages: autoSyncMessages ?? true,
        autoSyncContacts: autoSyncContacts ?? true,
        status: 'CONNECTED',
        lastError: null,
      });

      await dbStore.createAuditLog({
        userId: req.user?.id,
        action: 'SALESFORCE_CONNECT',
        resource: 'SalesforceIntegration',
        resourceId: integration.id,
        details: { instanceUrl, orgId, environment },
      });

      res.status(200).json({
        success: true,
        message: 'Salesforce connected and verified successfully',
        data: integration,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({
        success: false,
        error: `Could not verify Salesforce connection: ${msg}`,
      });
    }
  }

  /**
   * POST /api/salesforce/disconnect
   */
  public static async disconnect(req: AuthenticatedRequest, res: Response): Promise<void> {
    const integration = await dbStore.getSalesforceIntegration();
    if (integration && integration.accessToken) {
      try {
        await SalesforceClient.revokeToken({
          token: integration.accessToken,
          environment: integration.environment,
        });
      } catch (revokeErr) {
        console.warn('[Salesforce revoke warning]', revokeErr);
      }
    }

    await dbStore.disconnectSalesforce();

    await dbStore.createAuditLog({
      userId: req.user?.id,
      action: 'SALESFORCE_DISCONNECT',
      resource: 'SalesforceIntegration',
      details: { disconnectedAt: new Date().toISOString() },
    });

    res.status(200).json({
      success: true,
      message: 'Salesforce integration disconnected successfully',
    });
  }

  /**
   * PATCH /api/salesforce/settings
   */
  public static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { autoSyncMessages, autoSyncContacts, targetObject } = req.body;
    const integ = await dbStore.getSalesforceIntegration();

    if (!integ) {
      res.status(404).json({ success: false, error: 'Salesforce is not configured' });
      return;
    }

    const updated = await dbStore.saveSalesforceIntegration({
      ...integ,
      autoSyncMessages: autoSyncMessages !== undefined ? autoSyncMessages : integ.autoSyncMessages,
      autoSyncContacts: autoSyncContacts !== undefined ? autoSyncContacts : integ.autoSyncContacts,
      targetObject: targetObject || integ.targetObject,
    });

    res.status(200).json({ success: true, data: updated });
  }

  /**
   * POST /api/salesforce/sync
   */
  public static async triggerSync(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { entityType } = req.body; // 'CONTACT' | 'LEAD' | 'ALL'

    try {
      let result;
      if (entityType === 'CONTACT') {
        result = await SalesforceSyncService.syncContactsInbound();
      } else if (entityType === 'LEAD') {
        result = await SalesforceSyncService.syncLeadsInbound();
      } else {
        result = await SalesforceSyncService.syncAll();
      }

      await dbStore.createAuditLog({
        userId: req.user?.id,
        action: 'SALESFORCE_SYNC_TRIGGERED',
        resource: 'SalesforceSyncLog',
        details: { entityType: entityType || 'ALL', result },
      });

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }

  /**
   * POST /api/salesforce/contacts/:id/sync
   */
  public static async syncContact(req: AuthenticatedRequest, res: Response): Promise<void> {
    const contactId = String(req.params.id);
    const result = await SalesforceSyncService.syncContactOutbound(contactId);

    if (result.success) {
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  }

  /**
   * POST /api/salesforce/messages/:id/sync
   */
  public static async syncMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    const messageId = String(req.params.id);
    const result = await SalesforceSyncService.syncMessageToSalesforce(messageId);

    if (result.success) {
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  }

  /**
   * POST /api/salesforce/conversations/:id/sync
   */
  public static async syncConversation(req: AuthenticatedRequest, res: Response): Promise<void> {
    const conversationId = String(req.params.id);
    const result = await SalesforceSyncService.syncConversationToSalesforce(conversationId);

    if (result.success) {
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  }

  /**
   * GET /api/salesforce/logs
   */
  public static async getLogs(req: Request, res: Response): Promise<void> {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const logs = await dbStore.getSalesforceSyncLogs(limit);
    res.status(200).json({ success: true, count: logs.length, data: logs });
  }

  /**
   * DELETE /api/salesforce/logs
   */
  public static async clearLogs(_req: AuthenticatedRequest, res: Response): Promise<void> {
    await dbStore.clearSalesforceSyncLogs();
    res.status(200).json({ success: true, message: 'Salesforce sync logs cleared' });
  }

  /**
   * GET /api/salesforce/mappings
   */
  public static async getMappings(req: Request, res: Response): Promise<void> {
    const entityType = req.query.entityType as 'Contact' | 'Lead' | undefined;
    const mappings = await dbStore.getFieldMappings(entityType);
    res.status(200).json({ success: true, count: mappings.length, data: mappings });
  }

  /**
   * POST /api/salesforce/mappings
   */
  public static async createMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { entityType, localField, salesforceField, direction, isActive } = req.body;
    if (!entityType || !localField || !salesforceField) {
      res.status(400).json({
        success: false,
        error: 'entityType, localField, and salesforceField are required',
      });
      return;
    }

    const mapping = await dbStore.createFieldMapping({
      entityType,
      localField,
      salesforceField,
      direction: direction || 'BIDIRECTIONAL',
      isActive: isActive ?? true,
    });

    res.status(201).json({ success: true, data: mapping });
  }

  /**
   * PATCH /api/salesforce/mappings/:id
   */
  public static async updateMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const updated = await dbStore.updateFieldMapping(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Field mapping not found' });
      return;
    }
    res.status(200).json({ success: true, data: updated });
  }

  /**
   * DELETE /api/salesforce/mappings/:id
   */
  public static async deleteMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = String(req.params.id);
    const deleted = await dbStore.deleteFieldMapping(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Field mapping not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Mapping removed' });
  }

  /**
   * POST /api/salesforce/mappings/reset
   */
  public static async resetMappings(_req: AuthenticatedRequest, res: Response): Promise<void> {
    const mappings = await dbStore.resetDefaultFieldMappings();
    res.status(200).json({ success: true, message: 'Field mappings reset to defaults', data: mappings });
  }

  /**
   * GET /api/salesforce/describe/:sobject
   */
  public static async describeSObject(req: Request, res: Response): Promise<void> {
    const sobject = String(req.params.sobject);
    try {
      const describe = await sfClient.describeSObject(sobject);
      res.status(200).json({ success: true, data: describe });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ success: false, error: msg });
    }
  }

  /**
   * POST /api/salesforce/webhook
   */
  public static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const result = await SalesforceSyncService.handleWebhookEvent(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ success: false, error: msg });
    }
  }
}
