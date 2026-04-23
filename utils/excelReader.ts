import * as XLSX from 'xlsx';
import * as path from 'path';

const XLSX_PATH = path.resolve(__dirname, '../docs/ShoesHub_Test_Cases.xlsx');

// xlsx has a title row before headers — range: 1 skips it and uses row 2 as column names
function readSheet<T = Record<string, string>>(sheetName: string): T[] {
  const wb = XLSX.readFile(XLSX_PATH);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found in xlsx`);
  return XLSX.utils.sheet_to_json<T>(ws, { range: 1, defval: '' });
}

export interface TestCase {
  TC_ID: string;
  Module: string;
  Feature: string;
  'Test Name (TH)': string;
  Priority: string;
  Type: string;
  Role: string;
  Precondition: string;
  'Test Steps': string;
  'Expected Result': string;
  'Key data-testids': string;
  'API Endpoint': string;
  'Test Data Ref': string;
  'Automation Status': string;
  'Script Path': string;
  Tags: string;
}

export interface TestData {
  'Data Set ID': string;
  'TC Reference': string;
  Scenario: string;
  Username: string;
  Email: string;
  Password: string;
  'Confirm PW': string;
  'Full Name': string;
  Notes: string;
}

export interface Environment {
  Environment: string;
  'Base URL': string;
  'API URL': string;
  'Admin User': string;
  'Admin Pass': string;
  'Test User': string;
  'Test Pass': string;
  Debug: string;
  'Auto Seed': string;
  Notes: string;
}

export function getTestCases(filter?: {
  Module?: string;
  Priority?: string;
  'Automation Status'?: string;
  Tags?: string;
}): TestCase[] {
  const all = readSheet<TestCase>('📋 Test Cases');
  if (!filter) return all;
  return all.filter(tc =>
    Object.entries(filter).every(([key, val]) => {
      if (!val) return true;
      const field = tc[key as keyof TestCase];
      // Tags is comma-separated — check if any tag matches
      if (key === 'Tags') return String(field).split(',').map(t => t.trim()).includes(val);
      return field === val;
    })
  );
}

export function getTestData(dataSetId?: string): TestData[] {
  const all = readSheet<TestData>('📁 Test Data');
  return dataSetId ? all.filter(r => r['Data Set ID'] === dataSetId) : all;
}

export function getCredentials(tcRef: string): { username: string; password: string } {
  const row = getTestData().find(r => r['TC Reference'] === tcRef);
  if (!row) throw new Error(`No test data found for TC Reference: ${tcRef}`);
  return { username: row.Username, password: row.Password };
}

export function getEnvironment(name: string): Environment {
  const all = readSheet<Environment>('🌐 Environments');
  const env = all.find(e => e.Environment === name);
  if (!env) throw new Error(`Environment "${name}" not found in xlsx`);
  return env;
}
