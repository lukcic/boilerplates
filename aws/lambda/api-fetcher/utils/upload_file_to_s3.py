import boto3
from boto3.s3.transfer import S3Transfer

def upload_file_to_s3(filename, bucket, objectname=None):
    """Upload a file to an S3 bucket.

    :param filename: Local file or directory to upload
    :param bucket: S3 bucket name
    :param object_name: S3 object name, filename is default
    :return: True if file successfully uploaded, otherwise False
    """

    if objectname == None:
        objectname = filename
    
    s3_client = boto3.client('s3')
    transfer = S3Transfer(s3_client)

    try:
        response = transfer.upload_file(filename, bucket, objectname, extra_args={"StorageClass": "STANDARD_IA"})
    except Exception as e:
        print(f"Upload file to S3 failed: {e}")