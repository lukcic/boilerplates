#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import type { Settings } from '../src/settings';
import { loadSettings } from '../src/settings';
import { VpcStack } from '../src/stacks/vpc-stack';
import { BackupStack } from '../src/stacks/backup-stack';
import { SSMStack } from '../src/stacks/ssm-stack';
import { RdsStack } from '../src/stacks/rds-stack';
import { EcsStack } from '../src/stacks/ecs-stack';
import { Ec2Stack } from '../src/stacks/ec2-stack';

const settings: Settings = loadSettings();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const createApp = (settings: Settings) => {
  const app = new cdk.App();

  const backupStack = new BackupStack(app, 'backupStack', { settings, env });
  const ssmStack = new SSMStack(app, 'ssmStack', { settings, env });
  const vpcStack = new VpcStack(app, 'vpcStack', {
    settings,
    env,
    ssmProfileId: ssmStack.ssmProfileId,
  });
  const rdsStack = new RdsStack(app, 'rdsStack', {
    settings,
    env,
    vpc: vpcStack.vpc,
  });
  const ecsStack = new EcsStack(app, 'ecsStack', {
    settings,
    env,
    vpc: vpcStack.vpc,
  });
  const ec2Stack = new Ec2Stack(app, 'ec2Stack', {
    settings,
    env,
    vpc: vpcStack.vpc,
    ssmRole: ssmStack.ssmRole,
  });
};

createApp(settings);
