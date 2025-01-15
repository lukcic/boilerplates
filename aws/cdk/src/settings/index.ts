import * as dotenv from 'dotenv';

export interface Settings {
  projectName: string;
  stage: string;
  vpcCidr: string;
  natInstance: boolean;
  natInstanceAmiID: string;
}

export function loadSettings(): Settings {
  dotenv.config();

  const projectName = process.env.PROJECT_NAME || '';
  const stage = process.env.PROJECT_STAGE || '';
  const vpcCidr = process.env.VPC_CIDR || '10.10.0.0/16';

  const natInstance = false;
  const natInstanceAmiID = 'ami-001b36cbc16911c13';

  return { projectName, stage, vpcCidr, natInstance, natInstanceAmiID };
}
