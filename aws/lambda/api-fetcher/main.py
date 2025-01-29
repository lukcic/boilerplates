import os, requests, json, datetime
from utils.parse_link_header import parse_link_header
from utils.compress_catalog import compress_catalog
from utils.upload_file_to_s3 import upload_file_to_s3
from utils.encrypt_backup import encrypt_backup

url = "https://api.github.com/users/lukcic/repos?sort=pushed&per_page=1&page=1"
backup_dir = os.getcwd() + "/aws/lambda/api-fetcher/backup/"
bucket = "backups-lukcic-net"

token = os.environ["GITHUB_TOKEN"]
encryption_key = os.environ["ENC_KEY"]
# This key must be in specific format, generate it with:
# key = fernet.Fernet.generate_key()

if not os.path.exists(backup_dir):
    os.makedirs(backup_dir)

while url:
    response = requests.get(url, headers={'Authorization': f'Bearer {token}'})
    parsed_links = parse_link_header(response.headers['Link'])
    response_json = json.loads(response.text)
    for repo in response_json:
        repo_name = repo['name']
        filename = backup_dir + repo_name + ".json"
        with open(filename, "w") as file:
            file.write(json.dumps(response_json[0], indent= 4))
    url = parsed_links.get("next")

zip_file_path = backup_dir + f"github_backup_{datetime.date.today().strftime("%d-%m-%Y")}.zip"
compress_catalog(backup_dir, zip_file_path)

encrypt_backup(encryption_key, zip_file_path)

encrypted_zip = zip_file_path + ".enc"
upload_file_to_s3(encrypted_zip, bucket, 'github/' + encrypted_zip)
    