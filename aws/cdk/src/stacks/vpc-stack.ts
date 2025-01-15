import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Settings } from '../settings';

export interface VpcStackProps extends cdk.StackProps {
  settings: Settings;
}

export class VpcStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { settings } = props;

    const vpc = new ec2.Vpc(this, `${process.env.PROJECT_NAME}`, {
      ipAddresses: ec2.IpAddresses.cidr(settings.vpcCidr),
      availabilityZones: ['eu-north-1a'],
    });

    const privateSubnet = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    });
  }
}
