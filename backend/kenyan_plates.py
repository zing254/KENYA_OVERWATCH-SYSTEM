"""
Kenyan Number Plate System
Complete implementation of Kenyan vehicle registration plate formats

Based on NTSA (National Transport and Safety Authority) specifications:
- Civilian plates: K__ NNNx (white front, yellow rear)
- Government plates: GK X NNNx
- County plates: NN CG
- Diplomatic plates: N CD N K / N UN
- NGO plates: KX
- Military plates: KA / KN / KAF
- Electric vehicles: EVA / EMAA
- Special categories: motorcycles, trailers, tractors, etc.
"""

import re
from dataclasses import dataclass
from enum import Enum
from typing import Optional, Tuple, Dict, List


class PlateCategory(Enum):
    CIVILIAN = "civilian"
    GOVERNMENT = "government"
    COUNTY = "county"
    DIPLOMATIC_CD = "diplomatic_cd"
    DIPLOMATIC_UN = "diplomatic_un"
    NGO = "ngo"
    MILITARY_ARMY = "military_army"
    MILITARY_NAVY = "military_navy"
    MILITARY_AIRFORCE = "military_airforce"
    MOTORCYCLE = "motorcycle"
    TRAILER = "trailer"
    TRACTOR = "tractor"
    TUKTUK = "tuktuk"
    HEAVY_MACHINERY = "heavy_machinery"
    DEALER = "dealer"
    ELECTRIC_VEHICLE = "electric_vehicle"
    ELECTRIC_MOTORCYCLE = "electric_motorcycle"
    GOVERNOR = "governor"
    SPEAKER_NA = "speaker_na"
    SPEAKER_SENATE = "speaker_senate"
    CHIEF_JUSTICE = "chief_justice"
    COAST_GUARD = "coast_guard"
    UNKNOWN = "unknown"


@dataclass
class PlateInfo:
    """Complete information about a Kenyan number plate"""
    raw_plate: str
    normalized_plate: str
    category: PlateCategory
    is_valid: bool
    region: Optional[str] = None
    generation: Optional[str] = None
    vehicle_class: Optional[str] = None
    front_color: Optional[str] = None
    rear_color: Optional[str] = None
    text_color: Optional[str] = None
    country_code: Optional[int] = None  # For diplomatic
    organization: Optional[str] = None  # For diplomatic/UN
    rank: Optional[int] = None  # For diplomatic
    warnings: List[str] = None

    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


# Letters omitted from Kenyan plates (I and O to avoid confusion with 1 and 0)
OMITTED_LETTERS = {'I', 'O'}

# K-prefix series omitted (military/institutional confusion)
OMITTED_K_PREFIXES = {'KAF', 'KAI', 'KAO'}

# Regional mappings for first generation (pre-1980)
REGIONAL_PREFIXES = {
    'A': 'Mombasa',
    'B': 'Nairobi', 'H': 'Nairobi', 'T': 'Nairobi', 'W': 'Nairobi',
    'C': 'Nakuru',
    'D': 'Kericho',
    'E': 'Kisumu',
    'F': 'Eldoret',
    'G': 'Nyeri',
    'J': 'Kitale',
    'K': "Murang'a",
    'L': 'Kisii',
    'N': 'Kiambu',
    'Q': 'Machakos',
    'S': 'Lamu',
    'V': 'Isiolo',
    'Y': 'Nanyuki',
}

# Diplomatic country codes (partial list of major countries)
DIPLOMATIC_CODES = {
    1: "Germany", 2: "Russian Federation", 3: "Ethiopia", 4: "China",
    5: "Norway", 6: "Hungary", 7: "Egypt", 8: "Serbia", 9: "Italy",
    10: "France", 11: "Slovakia", 12: "Denmark", 13: "Japan", 14: "Sudan",
    15: "Austria", 16: "India", 17: "Australia", 18: "Canada",
    19: "Holy See", 20: "Finland", 21: "Switzerland", 22: "United Kingdom",
    23: "Liberia", 24: "Israel", 25: "Nigeria", 26: "Ghana",
    27: "Netherlands", 28: "Malawi", 29: "United States", 30: "Belgium",
    31: "Sweden", 32: "Pakistan", 33: "Poland", 34: "Korea",
    35: "Bulgaria", 36: "Greece", 37: "Cuba", 38: "Kuwait", 39: "Spain",
    47: "African Union", 50: "Somalia", 51: "Brazil", 52: "Turkey",
    123: "United Arab Emirates",
}

# UN Agency codes
UN_CODES = {
    40: "UNDP", 41: "WHO", 42: "UNESCO", 43: "World Bank (IBRD)",
    44: "FAO", 45: "WFP", 62: "UNHCR", 63: "UNICEF (ESARO)",
    67: "UNIC", 79: "UN-Habitat", 82: "UN-Habitat Kenya",
    90: "UNICEF Kenya", 105: "UNON", 108: "UNFPA", 110: "UNIDO",
}

# Valid stroke letters (excludes F, I, O)
VALID_STROKE_LETTERS = set("ABCDEGHJKLMNPQRSTUVWXYZ")


def normalize_plate(plate: str) -> str:
    """Normalize a plate number by removing spaces and converting to uppercase"""
    return re.sub(r'\s+', ' ', plate.strip().upper())


def is_valid_letter(ch: str) -> bool:
    """Check if a letter is valid for Kenyan plates (not I or O)"""
    return ch.isalpha() and ch.upper() not in OMITTED_LETTERS


def classify_plate(plate: str) -> PlateInfo:
    """
    Classify a Kenyan number plate and extract all information.
    
    Examples:
        KDA 123A -> Civilian, 5th Generation
        GK B653C -> Government
        01 CG 1234 -> County (Mombasa)
        22 CD 1 K -> Diplomatic (UK, Ambassador)
        40 UN 123 -> UN (UNDP)
        KX 06 B 68 -> NGO
        KA 1234 -> Military (Army)
        EVA 001A -> Electric Vehicle
    """
    original = plate
    plate = normalize_plate(plate)
    warnings = []

    # Try each pattern
    result = _try_match_patterns(plate, warnings)
    if result:
        result.raw_plate = original
        result.normalized_plate = plate
        return result

    # Unknown format
    return PlateInfo(
        raw_plate=original,
        normalized_plate=plate,
        category=PlateCategory.UNKNOWN,
        is_valid=False,
        warnings=["Unrecognized plate format"],
    )


def _try_match_patterns(plate: str, warnings: List[str]) -> Optional[PlateInfo]:
    """Try to match plate against known patterns"""

    # Government plates: GK X NNNx
    if plate.startswith('GK '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.GOVERNMENT, is_valid=True,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class="Government Vehicle",
        )

    # Governor plates: GVN NNN
    if plate.startswith('GVN '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.GOVERNOR, is_valid=True,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class="Governor Vehicle",
        )

    # Chief Justice: CJ
    if plate.startswith('CJ '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.CHIEF_JUSTICE, is_valid=True,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class="Chief Justice Vehicle",
        )

    # Speaker National Assembly: SNA
    if plate.startswith('SNA '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.SPEAKER_NA, is_valid=True,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class="Speaker Vehicle",
        )

    # Speaker Senate: SS
    if plate.startswith('SS '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.SPEAKER_SENATE, is_valid=True,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class="Speaker Vehicle",
        )

    # Diplomatic: NN CD N K
    dip_cd_match = re.match(r'^(\d{1,3})\s*CD\s*(\d)\s*K$', plate)
    if dip_cd_match:
        code = int(dip_cd_match.group(1))
        rank = int(dip_cd_match.group(2))
        country = DIPLOMATIC_CODES.get(code, f"Unknown ({code})")
        rank_name = {1: "Ambassador/High Commissioner", 2: "Minister", 3: "Counsellor"}.get(rank, f"Rank {rank}")
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.DIPLOMATIC_CD, is_valid=True,
            front_color="Red", rear_color="Red", text_color="White",
            country_code=code, organization=country, rank=rank,
            vehicle_class=f"Diplomatic - {rank_name}",
        )

    # UN: NN UN
    un_match = re.match(r'^(\d{1,3})\s*UN\s*(\d*)\s*K?$', plate)
    if un_match:
        code = int(un_match.group(1))
        agency = UN_CODES.get(code, f"Unknown UN ({code})")
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.DIPLOMATIC_UN, is_valid=True,
            front_color="Red", rear_color="Red", text_color="White",
            country_code=code, organization=agency,
            vehicle_class=f"UN - {agency}",
        )

    # County: NN CG
    county_match = re.match(r'^(\d{1,2})\s*CG\s*(\d*)$', plate)
    if county_match:
        county_code = int(county_match.group(1))
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.COUNTY, is_valid=True,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class=f"County Government ({county_code:02d})",
        )

    # NGO: KX NN X NN
    if plate.startswith('KX '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.NGO, is_valid=True,
            front_color="Red", rear_color="Red", text_color="White",
            vehicle_class="NGO Vehicle",
        )

    # Military Army: KA NNNN
    if plate.startswith('KA ') and not plate.startswith('KAF '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.MILITARY_ARMY, is_valid=True,
            front_color="Black", rear_color="Black", text_color="White",
            vehicle_class="Kenya Army",
        )

    # Military Navy: KN NNNN
    if plate.startswith('KN '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.MILITARY_NAVY, is_valid=True,
            front_color="Black", rear_color="Black", text_color="White",
            vehicle_class="Kenya Navy",
        )

    # Military Air Force: KAF NNNN
    if plate.startswith('KAF '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.MILITARY_AIRFORCE, is_valid=True,
            front_color="Black", rear_color="Black", text_color="White",
            vehicle_class="Kenya Air Force",
        )

    # Electric Vehicle: EVA NNNx
    if plate.startswith('EVA '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.ELECTRIC_VEHICLE, is_valid=True,
            front_color="Green", rear_color="Green", text_color="White",
            vehicle_class="Electric Vehicle",
        )

    # Electric Motorcycle: EMAA NNNx
    if plate.startswith('EMAA '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.ELECTRIC_MOTORCYCLE, is_valid=True,
            front_color="Green", rear_color="Green", text_color="White",
            vehicle_class="Electric Motorcycle",
        )

    # Motorcycle: KMCA NNNx
    if plate.startswith('KMCA '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.MOTORCYCLE, is_valid=True,
            front_color="N/A", rear_color="Yellow", text_color="Black",
            vehicle_class="Motorcycle",
        )

    # Tractor: KTCA NNNN
    if plate.startswith('KTCA '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.TRACTOR, is_valid=True,
            front_color="White", rear_color="White", text_color="Black",
            vehicle_class="Tractor",
        )

    # Tuk-tuk: KTWx NNNN
    if plate.startswith('KTW'):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.TUKTUK, is_valid=True,
            front_color="White", rear_color="White", text_color="Black",
            vehicle_class="Three-Wheeler (Tuk-tuk)",
        )

    # Heavy Machinery: KHMA NNNN
    if plate.startswith('KHMA '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.HEAVY_MACHINERY, is_valid=True,
            front_color="White", rear_color="White", text_color="Black",
            vehicle_class="Heavy Machinery",
        )

    # Trailer: ZA NNNN
    if plate.startswith('Z') and len(plate) >= 2 and plate[1].isalpha():
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.TRAILER, is_valid=True,
            front_color="N/A", rear_color="Yellow", text_color="Black",
            vehicle_class="Trailer",
        )

    # Dealer: KD NNNN
    if plate.startswith('KD '):
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.DEALER, is_valid=True,
            front_color="Green", rear_color="Green", text_color="White",
            vehicle_class="Dealer Vehicle",
        )

    # Coast Guard: NN KCG NN
    if 'KCG' in plate:
        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.COAST_GUARD, is_valid=True,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class="Kenya Coast Guard",
        )

    # Civilian plates: Kxx NNNx
    civilian_match = re.match(r'^K([A-Z]{2})\s*(\d{1,3})\s*([A-Z]?)$', plate)
    if civilian_match:
        second_letter = civilian_match.group(1)[0]
        third_letter = civilian_match.group(1)[1]
        number = civilian_match.group(2)
        stroke = civilian_match.group(3)

        # Validate letters
        if second_letter in OMITTED_LETTERS or third_letter in OMITTED_LETTERS:
            warnings.append("Contains invalid letter (I or O)")

        series = f"K{second_letter}{third_letter}"
        if series in OMITTED_K_PREFIXES:
            warnings.append(f"Series {series} is reserved")

        # Determine generation
        generation = _determine_generation(second_letter)

        # Determine region (for first generation)
        region = None
        if generation == "1st Gen (1950-1988)":
            region = REGIONAL_PREFIXES.get(second_letter, "Centralized")

        # Determine vehicle class based on second letter
        vehicle_class = "Civilian Vehicle"
        if second_letter == 'M' and third_letter == 'C':
            vehicle_class = "Motorcycle"
        elif second_letter == 'T' and third_letter == 'W':
            vehicle_class = "Tuk-tuk"
        elif second_letter == 'T' and third_letter == 'C':
            vehicle_class = "Tractor"

        # Validate stroke letter
        if stroke and stroke not in VALID_STROKE_LETTERS:
            warnings.append(f"Invalid stroke letter: {stroke}")

        return PlateInfo(
            raw_plate=plate, normalized_plate=plate,
            category=PlateCategory.CIVILIAN, is_valid=True,
            region=region, generation=generation,
            front_color="White", rear_color="Yellow", text_color="Black",
            vehicle_class=vehicle_class,
            warnings=warnings,
        )

    return None


def _determine_generation(second_letter: str) -> str:
    """Determine the generation based on the second letter"""
    gen_map = {
        'A': '2nd Gen (1989-2007)',
        'B': '3rd Gen (2007-2014)',
        'C': '4th Gen (2014-2020)',
        'D': '5th Gen (2020-Present)',
    }
    return gen_map.get(second_letter, '1st Gen (1950-1988)')


def validate_plate(plate: str) -> Tuple[bool, List[str]]:
    """Validate a Kenyan number plate and return (is_valid, warnings)"""
    info = classify_plate(plate)
    return info.is_valid, info.warnings


def get_plate_display_info(plate: str) -> Dict[str, str]:
    """Get display information for a plate (for UI rendering)"""
    info = classify_plate(plate)
    return {
        "plate": info.normalized_plate,
        "category": info.category.value,
        "front_color": info.front_color or "N/A",
        "rear_color": info.rear_color or "N/A",
        "text_color": info.text_color or "Black",
        "vehicle_class": info.vehicle_class or "Unknown",
        "region": info.region or "N/A",
        "generation": info.generation or "N/A",
        "is_valid": str(info.is_valid),
    }


# Example plates for testing
EXAMPLE_PLATES = [
    "KDA 123A",  # Civilian 5th Gen
    "KBA 456B",  # Civilian 3rd Gen
    "GK B653C",  # Government
    "01 CG 1234",  # County Mombasa
    "22 CD 1 K",  # UK Ambassador
    "40 UN 123",  # UNDP
    "KX 06 B 68",  # NGO
    "KA 1234",  # Army
    "KN 5678",  # Navy
    "KAF 9012",  # Air Force
    "KMCA 123A",  # Motorcycle
    "ZB 0149",  # Trailer
    "KTCA 1234",  # Tractor
    "EVA 001A",  # Electric Vehicle
    "GVN 047",  # Governor Nairobi
]
