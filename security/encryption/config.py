from dataclasses import dataclass


@dataclass
class EncryptionConfig:
    algorithm: str = "AES-256-GCM"
    key_derivation_function: str = "PBKDF2"
    pbkdf2_iterations: int = 100000
    salt_length: int = 32
    iv_length: int = 16
    tag_length: int = 16


__all__ = ["EncryptionConfig"]
