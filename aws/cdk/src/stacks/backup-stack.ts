import { Stack, StackProps, aws_backup, aws_iam } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Settings } from '../settings';

export interface BackupStackProps extends StackProps {
  settings: Settings;
}

export class BackupStack extends Stack {
  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id, props);

    const { settings } = props;

    const backupRole = new aws_iam.Role(
      this,
      `${settings.projectName}-${settings.stage}-backup_role`,
      {
        assumedBy: new aws_iam.ServicePrincipal('backup.amazonaws.com'),
        managedPolicies: [
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSBackupServiceRolePolicyForBackup'
          ),
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSBackupServiceRolePolicyForRestores'
          ),
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSBackupServiceRolePolicyForS3Backup'
          ),
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AWSBackupServiceRolePolicyForS3Restore'
          ),
        ],
      }
    );

    const backupPlan =
      settings.stage === 'production'
        ? aws_backup.BackupPlan.dailyMonthly1YearRetention(
            this,
            `${settings.projectName}-${settings.stage}-dailyMonthly1YearRetention`
          )
        : aws_backup.BackupPlan.daily35DayRetention(
            this,
            `${settings.projectName}-${settings.stage}-daily35DayRetention`
          );

    const backupSelection = new aws_backup.BackupSelection(
      this,
      `${settings.projectName}-${settings.stage}-backup_selection`,
      {
        backupPlan: backupPlan,
        allowRestores: true,
        role: backupRole,
        resources: [
          aws_backup.BackupResource.fromTag('AWSBackupEnabled', 'true'),
        ],
      }
    );
  }
}
