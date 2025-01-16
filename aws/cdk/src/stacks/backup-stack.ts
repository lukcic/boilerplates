import { Stack, StackProps, aws_backup, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Settings } from '../settings';

export interface BackupStackProps extends StackProps {
  settings: Settings;
}

export class BackupStack extends Stack {
  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id, props);

    const backupRole = new aws_iam.Role(
      this,
      `${props.settings.projectName}-${props.settings.stage}-backup_role`,
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
      props.settings.stage === 'production'
        ? aws_backup.BackupPlan.dailyMonthly1YearRetention(
            this,
            `${props.settings.projectName}-${props.settings.stage}-dailyMonthly1YearRetention`
          )
        : aws_backup.BackupPlan.daily35DayRetention(
            this,
            `${props.settings.projectName}-${props.settings.stage}-daily35DayRetention`
          );

    const backupSelection = new aws_backup.BackupSelection(
      this,
      `${props.settings.projectName}-${props.settings.stage}-backup_selection`,
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
