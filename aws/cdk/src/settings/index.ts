import * as dotenv from 'dotenv';

export interface Settings {
  projectName: string;
  stage: string;
  vpcCidr: string;
  natInstance: boolean;
  natInstanceAmiID: string;
  sshKeyPair: string;
  ec2InstanceAmiMap: { [region: string]: string };
}

export function loadSettings(): Settings {
  dotenv.config();

  const projectName = process.env.PROJECT_NAME || '';
  const stage = process.env.PROJECT_STAGE || '';
  const vpcCidr = process.env.VPC_CIDR || '10.10.0.0/16';
  const sshKeyPair = process.env.SSH_KEY_PAIR || '';
  const natInstance = false;
  const natInstanceAmiID = 'ami-001b36cbc16911c13';
  const ec2InstanceAmiMap = {
    'eu-north-1': 'ami-09a9858973b288bdd',
  };

  return {
    projectName,
    stage,
    vpcCidr,
    sshKeyPair,
    natInstance,
    natInstanceAmiID,
    ec2InstanceAmiMap,
  };
}
