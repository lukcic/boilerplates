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

    const vpc = new ec2.Vpc(this, `${settings.projectName}-vpc`, {
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
    });

    // const privateSubnet = new ec2.Subnet(this, 'privateSubnetB', {
    //   cidrBlock: settings.privateSubnetCidr,
    //   vpcId: vpc.vpcId,
    //   availabilityZone: 'eu-north-1b',
    // });
  }
}
