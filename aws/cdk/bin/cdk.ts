#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../src/stacks/vpc-stack';
import { BackupStack } from '../src/stacks/backup-stack';
import { loadSettings } from '../src/settings';
import type { Settings } from '../src/settings';

const settings: Settings = loadSettings();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const createApp = (settings: Settings) => {
  const app = new cdk.App();
  const vpcStack = new VpcStack(app, 'vpcStack', { settings, env });
  const backupStack = new BackupStack(app, 'backupStack', { settings, env });
};

createApp(settings);
