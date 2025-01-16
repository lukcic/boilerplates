#!/usr/bin/env python3
from atexit import register
from dotenv import dotenv_values, load_dotenv
from stacks.vpc_stack import VpcStack
from aws_cdk import App, Environment
import os

load_dotenv()
settings = dotenv_values(".env")

default_account = os.getenv('CDK_DEFAULT_ACCOUNT')
default_region = os.getenv('CDK_DEFAULT_REGION')
if not default_account or not default_region:
    raise ValueError("CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set in .env file") 

env = Environment(account=default_account, region=default_region)
app = App()

VpcStack(app, "VpcStack", env=env, settings=settings)

app.synth()
