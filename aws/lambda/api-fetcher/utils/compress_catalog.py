import zipfile, os

def compress_catalog(directory, zip_path):
    """Compresses an entire directory and its contents into a ZIP file.

    :param directory: The path to the directory that is to be compressed.
    :param zip_path: The path where the ZIP file will be saved.
    :return: None
    """

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(directory):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, os.path.dirname(directory))
                zip_file.write(file_path, relative_path)