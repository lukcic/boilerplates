import fernet

def encrypt_backup(encryption_key, filename):
    """Encrypts a file using Fernet symmetric encryption.

    :param encryption_key: The encryption key as a string.
    :param filename: The path to the file to be encrypted.
    :return: None
    """

    f = fernet.Fernet(bytes(encryption_key, encoding="ascii"))
    with open(filename, "rb") as m:
        original = m.read()
    encrypted = f.encrypt(original)
    with open(filename + ".enc", "wb") as e:
        e.write(encrypted)