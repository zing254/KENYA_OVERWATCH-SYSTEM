import os
import hashlib
import hmac
import secrets
import base64
from typing import Union
from dataclasses import dataclass


@dataclass
class EncryptionConfig:
    algorithm: str = "AES-256-GCM"
    key_derivation_function: str = "PBKDF2"
    pbkdf2_iterations: int = 100000
    salt_length: int = 32
    iv_length: int = 16
    tag_length: int = 16


def generate_key(password: str, salt: bytes, iterations: int = 100000) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
        dklen=32
    )


def encrypt_data(data: Union[str, bytes], key: Union[str, bytes]) -> bytes:
    if isinstance(data, str):
        data = data.encode("utf-8")
    
    if isinstance(key, str):
        salt = os.urandom(32)
        key = generate_key(key, salt)
    else:
        salt = os.urandom(32)
    
    iv = os.urandom(16)
    
    cipher = __import__("cryptography.hazmat.primitives.ciphers", fromlist=["Cipher", "algorithms", "modes"])
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    
    encryptor = Cipher(algorithms.AES(key), modes.GCM(iv)).encryptor()
    ciphertext = encryptor.update(data) + encryptor.finalize()
    
    result = salt + iv + encryptor.tag + ciphertext
    return base64.b64encode(result)


def decrypt_data(encrypted_data: Union[str, bytes], key: Union[str, bytes]) -> bytes:
    if isinstance(encrypted_data, str):
        encrypted_data = base64.b64decode(encrypted_data)
    
    if isinstance(key, str):
        raise ValueError("Key must be bytes when decrypting")
    
    salt = encrypted_data[:32]
    iv = encrypted_data[32:48]
    tag = encrypted_data[48:64]
    ciphertext = encrypted_data[64:]
    
    from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
    
    decryptor = Cipher(algorithms.AES(key), modes.GCM(iv, tag)).decryptor()
    return decryptor.update(ciphertext) + decryptor.finalize()


def hash_password(password: str, salt: bytes = None) -> tuple[str, bytes]:
    if salt is None:
        salt = os.urandom(32)
    
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )
    
    return base64.b64encode(salt + pwd_hash).decode("utf-8"), salt


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        decoded = base64.b64decode(stored_hash.encode("utf-8"))
        salt = decoded[:32]
        stored_pwd_hash = decoded[32:]
        
        pwd_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            100000
        )
        
        return hmac.compare_digest(pwd_hash, stored_pwd_hash)
    except Exception:
        return False


def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)


def hash_file(file_path: str, algorithm: str = "sha256") -> str:
    hash_func = hashlib.new(algorithm)
    
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_func.update(chunk)
    
    return hash_func.hexdigest()
