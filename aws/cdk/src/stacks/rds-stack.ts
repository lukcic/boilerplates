import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Settings } from '../settings';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  InstanceClass,
  InstanceSize,
  Peer,
  Port,
  SecurityGroup,
  InstanceType,
  Vpc,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  IDatabaseInstance,
  PostgresEngineVersion,
} from 'aws-cdk-lib/aws-rds';

export interface RdsStackProps extends StackProps {
  settings: Settings;
  vpc: Vpc;
}

export class RdsStack extends Stack {
  postgresDb: DatabaseInstance | IDatabaseInstance;
  rdsDbSecret: ISecret;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const rdsDbSecret = new Secret(
      this,
      `${props.settings.projectName}-${props.settings.stage}-rds_secret`,
      {
        secretName: `${props.settings.projectName}-${props.settings.stage}-rds_secret`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: 'rdsadmin',
          }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
        },
      }
    );

    const rdsSecurityGroup = new SecurityGroup(
      this,
      `${props.settings.projectName}-${props.settings.stage}-rds_sg`,
      {
        vpc: props.vpc,
      }
    );

    rdsSecurityGroup.addIngressRule(
      Peer.ipv4(props.vpc.privateSubnets[0].ipv4CidrBlock),
      Port.tcp(5432),
      'Ingress from Private subnet'
    );

    const rdsPgConfigProd = {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16_1,
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      credentials: Credentials.fromSecret(rdsDbSecret),
      vpc: props.vpc,
      securityGroups: [rdsSecurityGroup],
      allowMajorVersionUpgrade: true,
      storageEncrypted: true,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      multiAz: false,
      backupRetention: Duration.days(30),
      preferredBackupWindow: '04:30-05:00',
      preferredMaintenanceWindow: 'tue:05:00-tue:05:30',
      removalPolicy: RemovalPolicy.RETAIN,
      deletionProtection: true,
      enablePerformanceInsights: true,
    };

    const rdsPgConfig = {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16_1,
      }),
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      credentials: Credentials.fromSecret(rdsDbSecret),
      vpc: props.vpc,
      securityGroups: [rdsSecurityGroup],
      allowMajorVersionUpgrade: true,
      storageEncrypted: true,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
      multiAz: false,
      backupRetention: Duration.days(1),
      preferredBackupWindow: '04:30-05:00',
      preferredMaintenanceWindow: 'tue:05:00-tue:05:30',
      removalPolicy: RemovalPolicy.SNAPSHOT,
      deletionProtection: false,
      enablePerformanceInsights: true,
    };

    const postgresDb = new DatabaseInstance(
      this,
      `${props.settings.projectName}-${props.settings.stage}-rds_pgsql`,
      props.settings.stage === 'production' ? rdsPgConfigProd : rdsPgConfig
    );
  }
}
