export interface SalesforceTokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id: string; // Identity URL (e.g., https://login.salesforce.com/id/00D.../005...)
  token_type: string;
  issued_at: string;
  signature?: string;
  scope?: string;
}

export interface SalesforceIdentity {
  user_id: string;
  organization_id: string;
  username: string;
  email: string;
  display_name: string;
  photos?: {
    picture?: string;
    thumbnail?: string;
  };
}

export interface SalesforceContactRecord {
  Id: string;
  FirstName?: string | null;
  LastName: string;
  Name?: string | null;
  Email?: string | null;
  Phone?: string | null;
  MobilePhone?: string | null;
  Department?: string | null;
  Title?: string | null;
  Description?: string | null;
  Account?: {
    Name?: string | null;
  } | null;
  AccountId?: string | null;
  LastModifiedDate?: string;
  CreatedDate?: string;
}

export interface SalesforceLeadRecord {
  Id: string;
  FirstName?: string | null;
  LastName: string;
  Name?: string | null;
  Email?: string | null;
  Phone?: string | null;
  MobilePhone?: string | null;
  Company: string;
  Status?: string | null;
  Title?: string | null;
  Description?: string | null;
  LastModifiedDate?: string;
  CreatedDate?: string;
}

export interface SalesforceTaskRecord {
  Id?: string;
  WhoId?: string | null; // Contact or Lead ID
  WhatId?: string | null; // Account or Case ID
  Subject: string;
  Description?: string | null;
  Status: 'Not Started' | 'In Progress' | 'Completed' | 'Waiting on someone else' | 'Deferred';
  Priority: 'High' | 'Normal' | 'Low';
  ActivityDate?: string;
  TaskSubtype?: string;
}

export interface SalesforceCaseRecord {
  Id?: string;
  ContactId?: string | null;
  Subject: string;
  Description?: string | null;
  Status: 'New' | 'Working' | 'Escalated' | 'Closed';
  Priority: 'High' | 'Medium' | 'Low';
  Origin: 'WhatsApp' | 'Web' | 'Phone' | 'Email';
}

export interface SalesforceQueryResult<T> {
  totalSize: number;
  done: boolean;
  records: T[];
  nextRecordsUrl?: string;
}

export interface SalesforceDescribeField {
  name: string;
  label: string;
  type: string;
  updateable: boolean;
  createable: boolean;
  nillable: boolean;
}

export interface SalesforceDescribeResult {
  name: string;
  label: string;
  fields: SalesforceDescribeField[];
}

export interface SyncResult {
  success: boolean;
  direction: 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';
  entityType: 'CONTACT' | 'LEAD' | 'MESSAGE' | 'CONVERSATION' | 'ALL';
  recordsProcessed: number;
  recordsSynced: number;
  recordsFailed: number;
  durationMs: number;
  errors: string[];
  details?: Record<string, unknown>;
}
