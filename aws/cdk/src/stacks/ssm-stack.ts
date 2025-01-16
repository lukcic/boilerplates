import { aws_iam, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Settings } from '../settings';

export interface ssmStackProps extends StackProps {
  settings: Settings;
}

export class SSMStack extends Stack {
  ssmProfileId: string;
  ssmRole: aws_iam.Role;

  constructor(scope: Construct, id: string, props: ssmStackProps) {
    super(scope, id, props);

    const ssmInstanceCore = aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
      'AmazonSSMManagedInstanceCore'
    );

    const ssmRole = new aws_iam.Role(
      this,
      `${props.settings.projectName}-${props.settings.stage}-ssm_role`,
      {
        assumedBy: new aws_iam.ServicePrincipal('ec2.amazonaws.com'),
      }
    );

    ssmRole.addManagedPolicy(ssmInstanceCore);

    const ssmInstanceProfile = new aws_iam.CfnInstanceProfile(
      this,
      `${props.settings.projectName}-${props.settings.stage}-ssm_instance_profile`,
      {
        roles: [ssmRole.roleName],
      }
    );

    const ssmProfileId = ssmInstanceProfile.ref;
  }
}
