import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { Settings } from '../settings';

export interface VpcStackProps extends StackProps {
  settings: Settings;
}

export class VpcStack extends Stack {
  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { settings } = props;

    const vpc = new ec2.Vpc(
      this,
      `${settings.projectName}-${settings.stage}-vpc`,
      {
        vpcName: `${settings.projectName}-vpc`,
        ipAddresses: ec2.IpAddresses.cidr(settings.vpcCidr),
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'PublicSubnetA',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: 'PrivateSubnetA',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
        natGateways: 0,
        availabilityZones: ['eu-north-1a'],
        restrictDefaultSecurityGroup: false,
      }
    );

    // const privateSubnet = new ec2.Subnet(this, 'privateSubnetB', {
    //   cidrBlock: settings.privateSubnetCidr,
    //   vpcId: vpc.vpcId,
    //   availabilityZone: 'eu-north-1b',
    // });
  }
}
