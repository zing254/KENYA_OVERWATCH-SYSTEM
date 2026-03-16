"""
Kenya PSV (Public Service Vehicle) Routes Module
Comprehensive data on Nairobi matatu routes, SACCOs, and CBD stages
Based on NTSA, KBS-era numbering, and gazetted routes
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional
import random


class RouteLine(Enum):
    A = "A"  # Kiambu Road Corridor
    B = "B"  # Thika Road Corridor
    C = "C"  # Jogoo Road / Eastlands
    D = "D"  # Ngong Road / Southwest
    E = "E"  # Langata Road / South
    F = "F"  # Mombasa Road / Southeast
    G = "G"  # Waiyaki Way / Western
    H = "H"  # Kiambu / Northern Bypass
    I = "I"  # Upper Hill / Kilimani
    J = "J"  # Kangundo Road / Kayole


class VehiclePlatform(Enum):
    MINIBUS_14 = "minibus_14"
    MATATU_25 = "matatu_25"
    BUS_33 = "bus_33"
    BUS_51 = "bus_51"
    ELECTRIC = "electric"


@dataclass
class CBDStage:
    name: str
    location: str
    directions_served: List[str]
    latitude: float
    longitude: float
    routes: List[str]


@dataclass
class PSVRoute:
    route_id: str
    route_number: str
    line: str
    corridor: str
    cbd_stage: str
    origin: str
    destination: str
    key_stages: List[str]
    fare_min_ksh: int
    fare_max_ksh: int
    distance_km: float
    vehicle_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


@dataclass
class SACCO:
    sacco_id: str
    name: str
    full_name: Optional[str]
    routes: List[str]
    primary_corridor: str
    cbd_stage: str
    fleet_estimate: int
    vehicle_type: str
    famous_vehicles: List[str]
    founded_year: Optional[int]
    is_electric: bool = False


# ==================== CBD STAGES ====================

CBD_STAGES = [
    CBDStage(
        name="Railways",
        location="Haile Selassie Avenue",
        directions_served=["South", "Southwest"],
        latitude=-1.2921, longitude=36.8234,
        routes=["2", "3", "24", "111", "125", "126", "110", "102", "41"]
    ),
    CBDStage(
        name="OTC",
        location="Haile Selassie Avenue",
        directions_served=["East", "Eastlands"],
        latitude=-1.2890, longitude=36.8267,
        routes=["33", "34", "35", "36", "58", "60", "69", "1960", "1961"]
    ),
    CBDStage(
        name="Kencom",
        location="City Hall Way / Moi Avenue",
        directions_served=["West", "Southwest"],
        latitude=-1.2847, longitude=36.8208,
        routes=["1", "8", "46", "48", "100", "102", "7C"]
    ),
    CBDStage(
        name="Odeon",
        location="Moi Avenue / Tom Mboya Street",
        directions_served=["North", "Thika Road"],
        latitude=-1.2831, longitude=36.8242,
        routes=["25", "30", "44", "45", "105", "118", "119", "145", "146", "236", "237"]
    ),
    CBDStage(
        name="Afya Centre",
        location="Aga Khan Road",
        directions_served=["Upper Hill", "Kilimani"],
        latitude=-1.2905, longitude=36.8158,
        routes=["7C"]
    ),
    CBDStage(
        name="Archives",
        location="Moi Avenue (National Archives)",
        directions_served=["Multiple"],
        latitude=-1.2856, longitude=36.8223,
        routes=["33", "46", "111", "7C", "236", "237"]
    ),
    CBDStage(
        name="Muthurwa",
        location="Landhies Road",
        directions_served=["Long-distance", "Eastlands"],
        latitude=-1.2901, longitude=36.8312,
        routes=["58", "35", "36", "Intercity"]
    ),
    CBDStage(
        name="Ngara",
        location="Murang'a Road",
        directions_served=["North", "Kiambu"],
        latitude=-1.2756, longitude=36.8234,
        routes=["106", "107", "108", "114", "115", "116", "117", "7"]
    ),
    CBDStage(
        name="Khoja",
        location="River Road / Tom Mboya Street",
        directions_served=["Northwest", "Kiambu"],
        latitude=-1.2838, longitude=36.8267,
        routes=["106", "107", "22", "23", "105"]
    ),
    CBDStage(
        name="Bus Station",
        location="Near Afya Centre",
        directions_served=["Multiple"],
        latitude=-1.2898, longitude=36.8189,
        routes=["24", "11", "12", "14", "15", "237"]
    ),
]

CBD_STAGES_MAP = {s.name: s for s in CBD_STAGES}


# ==================== PSV ROUTES ====================

PSV_ROUTES = [
    # LINE A - Kiambu Road Corridor
    PSVRoute("NBI-A100", "100", "A", "Kiambu Road", "Odeon", "CBD", "Kiambu Town",
             ["Ngara", "Muthaiga", "CID HQ", "Ridgeways"], 80, 150, 18, "bus"),
    PSVRoute("NBI-A106", "106", "A", "Limuru Road", "Khoja", "CBD", "Banana/Ruaka",
             ["Ngara", "Gigiri", "Village Market", "Two Rivers"], 50, 150, 22, "mixed"),
    PSVRoute("NBI-A107", "107", "A", "Limuru Road", "Khoja", "CBD", "Ndenderu",
             ["Ngara", "Gigiri", "Ruaka"], 50, 150, 20, "both"),
    PSVRoute("NBI-A108", "108", "A", "Limuru Road", "Khoja", "CBD", "Gachie",
             ["Ngara", "Ruaka"], 50, 120, 18, "both"),
    PSVRoute("NBI-A114", "114", "A", "Limuru Road", "Ngara", "CBD", "Limuru Town",
             ["Ngara", "Ruaka", "Banana", "Limuru"], 100, 200, 35, "both"),
    PSVRoute("NBI-A115", "115", "A", "Waiyaki Way", "Khoja", "CBD", "Limuru Town",
             ["Westlands", "Uthiru", "Kinoo"], 100, 200, 38, "both"),
    PSVRoute("NBI-A116", "116", "A", "Kiambu Road", "Koja", "CBD", "Thindigua",
             ["Kiambu Road", "Kiambu Town"], 50, 100, 15, "both"),
    PSVRoute("NBI-A117", "117", "A", "Kiambu Road", "Koja", "CBD", "Kiambu Areas",
             ["Kiambu Road"], 50, 100, 14, "both"),
    
    # LINE B - Thika Road Corridor
    PSVRoute("NBI-B14A", "14A", "B", "Thika Road", "Ronald Ngala", "CBD", "Kasarani/Mwiki",
             ["Pangani", "Roasters", "Kasarani"], 50, 100, 12, "minibus_14"),
    PSVRoute("NBI-B17A", "17A", "B", "Thika Road", "Bus Station", "CBD", "Zimmerman/Kahawa West",
             ["Githurai", "Zimmerman"], 50, 100, 15, "both"),
    PSVRoute("NBI-B17B", "17B", "B", "Thika Road", "Bus Station", "CBD", "Kasarani/Roysambu/USIU",
             ["Kasarani", "Roysambu"], 50, 100, 14, "both"),
    PSVRoute("NBI-B25", "25", "B", "Thika Road", "Timboroa Lane", "CBD", "Thika/Ruiru",
             ["Ruiru", "Juja", "Thika"], 100, 250, 45, "bus"),
    PSVRoute("NBI-B25A", "25A", "B", "Thika Road", "Timboroa Lane", "CBD", "Thika",
             ["Ruiru", "Thika"], 100, 250, 42, "bus"),
    PSVRoute("NBI-B30", "30", "B", "Thika Road", "Koja", "CBD", "Kahawa Barracks/KU",
             ["Kahawa", "Kenyatta University"], 80, 150, 25, "bus"),
    PSVRoute("NBI-B44", "44", "B", "Thika Road", "Odeon", "CBD", "Kahawa West/Githurai",
             ["Githurai", "Zimmerman", "Kahawa West"], 50, 150, 20, "both"),
    PSVRoute("NBI-B45", "45", "B", "Thika Road", "Odeon/Latema", "CBD", "Githurai 45",
             ["Roysambu", "Kasarani", "Githurai 45"], 50, 150, 18, "both"),
    PSVRoute("NBI-B53", "53", "B", "Thika Road", "Latema", "CBD", "Thome",
             ["Roysambu", "Thome"], 50, 100, 16, "both"),
    PSVRoute("NBI-B105", "105", "B", "Thika Road", "Ronald Ngala", "CBD", "Kahawa Wendani/Sukari",
             ["Kahawa Wendani", "Kahawa Sukari"], 50, 150, 22, "bus"),
    PSVRoute("NBI-B118", "118", "B", "Thika Road", "Koja", "CBD", "Ruaraka/Kasarani/Roysambu",
             ["Ruaraka", "Kasarani", "Roysambu"], 50, 100, 12, "both"),
    PSVRoute("NBI-B119", "119", "B", "Thika Road", "Koja", "CBD", "Thika Road Suburbs",
             ["Kasarani area"], 50, 100, 10, "both"),
    PSVRoute("NBI-B145", "145", "B", "Thika Road", "Odeon/Latema", "CBD", "Ruiru",
             ["Kahawa", "KU", "Membley", "Ruiru"], 80, 200, 30, "bus"),
    PSVRoute("NBI-B146", "146", "B", "Thika Road", "Mumbi Lane", "CBD", "Juja",
             ["Ruiru", "Juja"], 100, 250, 40, "bus"),
    PSVRoute("NBI-B236", "236", "B", "Thika Road", "Kencom/Archives", "CBD", "Juja",
             ["GSU", "Kahawa", "KU", "Juja"], 100, 250, 42, "bus"),
    PSVRoute("NBI-B237", "237", "B", "Thika Road", "Kencom/Archives", "CBD", "Thika/Makongeni",
             ["Ruiru", "Juja", "Thika"], 100, 300, 48, "bus"),
    
    # LINE C - Jogoo Road / Eastlands
    PSVRoute("NBI-C22", "22", "C", "Jogoo Road", "Ronald Ngala", "CBD", "Hamza/Ofafa Jericho",
             ["Makadara", "Hamza", "Jerusalem"], 30, 80, 8, "minibus_14"),
    PSVRoute("NBI-C32", "32", "C", "Jogoo Road", "OTC/Muthurwa", "CBD", "Dandora",
             ["Kariobangi", "Dandora"], 50, 100, 12, "both"),
    PSVRoute("NBI-C33", "33", "C", "Jogoo Road", "OTC/Archives", "CBD", "Embakasi/Pipeline",
             ["Makadara", "Donholm", "Pipeline"], 50, 100, 15, "both"),
    PSVRoute("NBI-C34", "34", "C", "Mombasa Road", "OTC", "CBD", "JKIA/Embakasi",
             ["Pipeline", "JKIA"], 50, 150, 20, "both"),
    PSVRoute("NBI-C34A", "34A", "C", "Mombasa Road", "OTC", "CBD", "JKIA Airport",
             ["Pipeline", "Airport"], 100, 200, 22, "both"),
    PSVRoute("NBI-C35", "35", "C", "Jogoo Road", "OTC/Muthurwa", "CBD", "Kayole",
             ["Donholm", "Saika", "Kayole"], 50, 100, 14, "both"),
    PSVRoute("NBI-C36", "36", "C", "Jogoo Road", "Muthurwa", "CBD", "Komarock",
             ["Donholm", "Kangundo Road", "Komarock"], 50, 100, 16, "both"),
    PSVRoute("NBI-C58", "58", "C", "Jogoo Road", "OTC/Archives", "CBD", "Buru Buru",
             ["Makadara", "Buru Buru"], 30, 80, 7, "both"),
    PSVRoute("NBI-C60", "60", "C", "Jogoo Road", "OTC", "CBD", "Umoja",
             ["Donholm", "Buru Buru", "Umoja"], 30, 80, 9, "both"),
    
    # LINE D - Ngong Road / Southwest
    PSVRoute("NBI-D1", "1", "D", "Ngong Road", "GPO", "CBD", "Junction Mall/Dagoretti",
             ["Junction Mall", "Dagoretti Corner"], 30, 80, 8, "minibus_14"),
    PSVRoute("NBI-D2", "2", "D", "Ngong Road", "Railways", "CBD", "Ngong/Karen/Kiserian",
             ["Karen", "Ngong"], 80, 200, 28, "both"),
    PSVRoute("NBI-D8", "8", "D", "Ngong Road", "Railways", "CBD", "Kibera/Dagoretti",
             ["Kibera", "Dagoretti"], 30, 80, 6, "both"),
    PSVRoute("NBI-D46", "46", "D", "Ngong Road", "Kencom", "CBD", "Kawangware",
             ["Yaya", "Junction", "Kawangware"], 50, 100, 12, "both"),
    PSVRoute("NBI-D102", "102", "D", "Ngong Road", "Bus Station", "CBD", "Kikuyu Town",
             ["Dagoretti", "Kinoo", "Kikuyu"], 80, 150, 20, "bus"),
    PSVRoute("NBI-D111", "111", "D", "Ngong Road", "Railways", "CBD", "Ngong Town",
             ["Dagoretti Corner", "Ngong Hills", "Ngong"], 80, 200, 30, "bus"),
    
    # LINE E - Langata Road / South
    PSVRoute("NBI-E3", "3", "E", "Langata Road", "Railways/Kencom", "CBD", "Langata/Karen/Hardy",
             ["Bomas", "Karen", "Hardy"], 50, 150, 18, "both"),
    PSVRoute("NBI-E24", "24", "E", "Langata Road", "Bus Station/Railways", "CBD", "Karen/Hardy",
             ["Langata", "Bomas", "Karen"], 80, 200, 22, "both"),
    PSVRoute("NBI-E100", "100", "E", "Langata Road", "St. Peter Clavers", "CBD", "Kibera/Olympic",
             ["Fort Jesus", "Olympic"], 30, 80, 5, "both"),
    PSVRoute("NBI-E125", "125", "E", "Langata Road", "Railways", "CBD", "Ongata Rongai",
             ["Carnivore", "Bomas", "Rongai"], 80, 200, 25, "bus"),
    PSVRoute("NBI-E126", "126", "E", "Magadi Road", "Railways", "CBD", "Ongata Rongai",
             ["Kiserian", "Rongai"], 80, 200, 28, "bus"),
    
    # LINE F - Mombasa Road / Southeast
    PSVRoute("NBI-F110", "110", "F", "Mombasa Road", "Bus Station", "CBD", "Kitengela/Athi River",
             ["Industrial Area", "Athi River", "Kitengela"], 100, 300, 35, "bus"),
    PSVRoute("NBI-F237A", "237", "F", "Mombasa Road", "Bus Station/OTC", "CBD", "Syokimau/Mlolongo",
             ["Airport", "Mlolongo", "Syokimau"], 80, 200, 25, "both"),
    
    # LINE G - Waiyaki Way / Western
    PSVRoute("NBI-G23", "23", "G", "Waiyaki Way", "Khoja/Odeon", "CBD", "Westlands/Kangemi",
             ["Museum Hill", "Westlands", "Kangemi"], 30, 100, 10, "both"),
    PSVRoute("NBI-G48", "48", "G", "Waiyaki Way", "Latema", "CBD", "Kileleshwa/Lavington",
             ["Chiromo", "Kileleshwa", "Lavington"], 30, 100, 8, "both"),
    PSVRoute("NBI-G48A", "48A", "G", "Waiyaki Way", "Odeon", "CBD", "Kileleshwa/Lavington Mall",
             ["Kileleshwa", "Lavington"], 30, 100, 9, "both"),
    PSVRoute("NBI-G108", "108", "G", "Waiyaki Way", "Muthurwa", "CBD", "Kikuyu/Kinoo/Wangige",
             ["Kangemi", "Uthiru", "Kinoo", "Kikuyu"], 80, 150, 22, "bus"),
    
    # LINE H - Kiambu / Northern Bypass
    PSVRoute("NBI-H106", "106", "H", "Kiambu Road", "Koja", "CBD", "Banana",
             ["Muthaiga", "Ridgeways", "Banana"], 50, 150, 18, "both"),
    PSVRoute("NBI-H116", "116", "H", "Kiambu Road", "Koja/Odeon", "CBD", "Kiambu Town",
             ["Kiambu Road", "Thindigua"], 50, 100, 15, "both"),
    
    # LINE I - Upper Hill / Kilimani
    PSVRoute("NBI-I4W", "4W", "I", "Ngong Road", "Kencom", "CBD", "Hurlingham/Kawangware",
             ["Hurlingham", "Argwings Kodhek"], 30, 80, 7, "minibus_14"),
    PSVRoute("NBI-I7C", "7C", "I", "Upper Hill", "Kencom", "CBD", "Upper Hill/KNH",
             ["Community", "Nairobi Hospital", "KNH"], 30, 80, 5, "bus"),
    
    # LINE J - Kangundo Road / Kayole
    PSVRoute("NBI-J58", "58", "J", "Kangundo Road", "OTC/Muthurwa", "CBD", "Komarock",
             ["Kangundo Road", "Komarock"], 50, 100, 14, "both"),
    PSVRoute("NBI-J1960", "1960", "J", "Kangundo Road", "OTC/Muthurwa", "CBD", "Kayole",
             ["Kayole", "Saika"], 50, 100, 12, "both"),
    PSVRoute("NBI-J1961", "1961", "J", "Kangundo Road", "OTC/Muthurwa", "CBD", "Kayole",
             ["Kayole", "Mihang'o"], 50, 100, 13, "both"),
]

PSV_ROUTES_MAP = {r.route_id: r for r in PSV_ROUTES}
PSV_ROUTES_BY_NUMBER = {}
for r in PSV_ROUTES:
    if r.route_number not in PSV_ROUTES_BY_NUMBER:
        PSV_ROUTES_BY_NUMBER[r.route_number] = []
    PSV_ROUTES_BY_NUMBER[r.route_number].append(r)


# ==================== SACCO OPERATORS ====================

SACCO_OPERATORS = [
    SACCO("SACCO-SM", "Super Metro", "Super Metro Sacco", ["105", "111", "236", "237"],
          "Thika Road / Ngong Road", "Kencom/Archives", 200, "bus",
          ["Super Metro Buses"], 2013, True),
    SACCO("SACCO-UM", "Umoinner", "Umoja Innercore Tena Matatu Owners Sacco", ["60"],
          "Jogoo Road / Umoja", "OTC/Archives", 100, "both",
          ["Opposite", "Night Nurse", "Black Mamba", "Woodini", "Mastermind"], 1990, False),
    SACCO("SACCO-EM", "Embassava", "Embakasi-Savannah Sacco", ["33", "34"],
          "Jogoo Road / Embakasi", "OTC", 80, "both",
          ["Various nganya"], 1985, False),
    SACCO("SACCO-FT", "Forward Travellers", "Forward Travellers Sacco", ["35", "36"],
          "Kangundo Road", "OTC/Muthurwa", 150, "both",
          ["Yellow-green fleet"], 1980, False),
    SACCO("SACCO-LO", "Lopha", "Lopha Multipurpose Co-operative", ["106", "107", "114", "115", "145", "237"],
          "Kiambu/Thika Road", "Odeon/Ngara", 80, "both",
          ["Lopha buses"], 1995, False),
    SACCO("SACCO-KM", "Kenya Mpya", "Kenya Mpya Sacco", ["237", "58"],
          "Thika Road / Jogoo Road", "Various", 100, "bus",
          ["Kenya Mpya buses"], 1998, False),
    SACCO("SACCO-CH", "Citi Hoppa", "Citi Hoppa Limited", ["7C", "46", "48", "100"],
          "Multiple routes", "Kencom", 100, "bus_51",
          ["Green/Yellow buses"], 1990, True),
    SACCO("SACCO-KBS", "KBS", "Kenya Bus Service Management", ["7C", "24", "46"],
          "Multiple routes", "GPO/Kencom", 100, "bus_51",
          ["KBS blue buses"], 1934, False),
    SACCO("SACCO-44", "Fourty Four", "Fourty Four Sacco", ["44"],
          "Thika Road", "Odeon", 50, "both",
          [], 1990, False),
    SACCO("SACCO-45", "Githurai 45", "Githurai 45 Sacco", ["45"],
          "Thika Road", "Odeon/Latema", 60, "both",
          [], 1988, False),
    SACCO("SACCO-OL", "Ongata Line", "Ongata Line Sacco", ["125", "126"],
          "Langata/Magadi Road", "Railways/Kencom", 100, "both",
          ["Boombox"], 1995, False),
    SACCO("SACCO-B58", "Buruburu 58", "Buruburu 58 Travellers", ["58"],
          "Jogoo Road", "OTC/Archives", 50, "minibus_14",
          [], 1992, False),
    SACCO("SACCO-DM", "Double M", "Double M Buses", ["25", "30", "145"],
          "Thika Road", "Various", 50, "bus",
          ["Double M buses"], 1995, False),
    SACCO("SACCO-NE", "NTVRS", "NTVRS Limited", ["111"],
          "Ngong Road", "Moi Avenue", 30, "both",
          ["Flip Squad 6"], 1990, False),
    SACCO("SACCO-NM", "NMOA", "Ngong Matatu Owners Association", ["111"],
          "Ngong Road", "Archives/Railways", 40, "both",
          ["Old Skool"], 1985, False),
    SACCO("SACCO-EXP", "Expresso", "Expresso Ltd", ["17A"],
          "Kasarani Road", "Tom Mboya", 40, "both",
          ["Boombox"], 1992, False),
    SACCO("SACCO-SB", "Sunbird", "Sunbird Sacco", ["44"],
          "Thika Road", "Ronald Ngala", 30, "bus",
          ["Sunbird buses"], 1990, False),
    SACCO("SACCO-NC", "Nicco", "Nicco Movers", ["145", "237"],
          "Thika Road", "Khoja", 40, "bus",
          ["Nicco Buses"], 2000, False),
    SACCO("SACCO-KS", "Kensilver", "Kensilver Sacco", ["237"],
          "Thika Road", "Khoja", 30, "bus",
          [], 1995, False),
]

SACCO_MAP = {s.sacco_id: s for s in SACCO_OPERATORS}


# ==================== INTERCITY ROUTES ====================

INTERCITY_ROUTES = [
    {"id": "IC-001", "from": "Nairobi", "to": "Mombasa", "distance_km": 480,
     "duration_hours": 8, "operators": ["Coast Bus", "Modern Coast", "ENA Coach"],
     "departure": "Machakos Country Bus", "fare_ksh": "1500-3000"},
    {"id": "IC-002", "from": "Nairobi", "to": "Nakuru", "distance_km": 160,
     "duration_hours": 3, "operators": ["Mololine", "Easy Coach", "Super Metro"],
     "departure": "Mololine Odeon", "fare_ksh": "500-1200"},
    {"id": "IC-003", "from": "Nairobi", "to": "Kisumu", "distance_km": 350,
     "duration_hours": 6, "operators": ["Mololine", "Easy Coach", "Guardian"],
     "departure": "Machakos Country Bus", "fare_ksh": "1000-2500"},
    {"id": "IC-004", "from": "Nairobi", "to": "Eldoret", "distance_km": 310,
     "duration_hours": 5, "operators": ["Mololine", "North Rift Shuttle"],
     "departure": "Mololine Odeon", "fare_ksh": "800-2000"},
    {"id": "IC-005", "from": "Nairobi", "to": "Nyeri", "distance_km": 150,
     "duration_hours": 2.5, "operators": ["2NK", "4NTE", "Mbukinya"],
     "departure": "Muthurwa", "fare_ksh": "400-1000"},
    {"id": "IC-006", "from": "Nairobi", "to": "Thika", "distance_km": 50,
     "duration_hours": 1, "operators": ["Super Metro", "Route 25/25A"],
     "departure": "Odeon/Timboroa Lane", "fare_ksh": "100-300"},
    {"id": "IC-007", "from": "Nairobi", "to": "Kitengela", "distance_km": 35,
     "duration_hours": 1, "operators": ["Route 110"],
     "departure": "Bus Station", "fare_ksh": "80-200"},
    {"id": "IC-008", "from": "Nairobi", "to": "Naivasha", "distance_km": 90,
     "duration_hours": 1.5, "operators": ["Easy Coach", "4NTE"],
     "departure": "Various", "fare_ksh": "400-800"},
    {"id": "IC-009", "from": "Nairobi", "to": "Nanyuki", "distance_km": 175,
     "duration_hours": 3, "operators": ["2NK"],
     "departure": "Muthurwa", "fare_ksh": "500-1200"},
    {"id": "IC-010", "from": "Nairobi", "to": "Machakos", "distance_km": 65,
     "duration_hours": 1.5, "operators": ["Kinatwa", "MAKATA"],
     "departure": "Muthurwa", "fare_ksh": "200-500"},
]


# ==================== CRASH HOTSPOTS (route-related) ====================

ROUTE_HOTSPOTS = [
    {"route": "111", "location": "Ngong Road - Dagoretti Corner", "lat": -1.3045, "lng": 36.7589,
     "crashes_2024": 28, "severity": "high", "cause_primary": "speeding"},
    {"route": "237", "location": "Thika Road - Ruiru Bypass", "lat": -1.1500, "lng": 36.9600,
     "crashes_2024": 35, "severity": "high", "cause_primary": "reckless_driving"},
    {"route": "58", "location": "Jogoo Road - Donholm", "lat": -1.2934, "lng": 36.8890,
     "crashes_2024": 22, "severity": "medium", "cause_primary": "speeding"},
    {"route": "33", "location": "Jogoo Road - Pipeline", "lat": -1.3100, "lng": 36.9000,
     "crashes_2024": 18, "severity": "medium", "cause_primary": "pedestrian_crossing"},
    {"route": "46", "location": "Ngong Road - Kawangware", "lat": -1.2800, "lng": 36.7400,
     "crashes_2024": 15, "severity": "medium", "cause_primary": "overcrowding"},
    {"route": "125", "location": "Langata Road - Bomas", "lat": -1.3500, "lng": 36.7700,
     "crashes_2024": 12, "severity": "medium", "cause_primary": "speeding"},
    {"route": "44", "location": "Thika Road - Githurai", "lat": -1.2000, "lng": 36.8900,
     "crashes_2024": 20, "severity": "high", "cause_primary": "overloading"},
    {"route": "60", "location": "Jogoo Road - Umoja", "lat": -1.2850, "lng": 36.8950,
     "crashes_2024": 14, "severity": "medium", "cause_primary": "speeding"},
    {"route": "106", "location": "Limuru Road - Ruaka", "lat": -1.2000, "lng": 36.7700,
     "crashes_2024": 10, "severity": "low", "cause_primary": "road_condition"},
    {"route": "108", "location": "Waiyaki Way - Kangemi", "lat": -1.2600, "lng": 36.7400,
     "crashes_2024": 16, "severity": "medium", "cause_primary": "pedestrian_crossing"},
]


# ==================== API FUNCTIONS ====================

def get_all_routes(line: Optional[str] = None, stage: Optional[str] = None) -> List[dict]:
    """Get all PSV routes with optional filtering"""
    results = PSV_ROUTES
    if line:
        results = [r for r in results if r.line == line]
    if stage:
        results = [r for r in results if r.cbd_stage.lower() == stage.lower()]
    return [_route_to_dict(r) for r in results]


def get_route_by_number(route_number: str) -> List[dict]:
    """Get routes by route number"""
    routes = PSV_ROUTES_BY_NUMBER.get(route_number, [])
    return [_route_to_dict(r) for r in routes]


def get_route_by_id(route_id: str) -> Optional[dict]:
    """Get a specific route by ID"""
    route = PSV_ROUTES_MAP.get(route_id)
    return _route_to_dict(route) if route else None


def get_all_stages() -> List[dict]:
    """Get all CBD stages"""
    return [
        {
            "name": s.name,
            "location": s.location,
            "directions": s.directions_served,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "routes": s.routes,
            "route_count": len(s.routes),
        }
        for s in CBD_STAGES
    ]


def get_stage_by_name(name: str) -> Optional[dict]:
    """Get a specific CBD stage"""
    stage = CBD_STAGES_MAP.get(name)
    if not stage:
        return None
    return {
        "name": stage.name,
        "location": stage.location,
        "directions": stage.directions_served,
        "latitude": stage.latitude,
        "longitude": stage.longitude,
        "routes": stage.routes,
        "route_count": len(stage.routes),
    }


def get_all_saccos(corridor: Optional[str] = None) -> List[dict]:
    """Get all SACCOs with optional corridor filter"""
    results = SACCO_OPERATORS
    if corridor:
        results = [s for s in results if corridor.lower() in s.primary_corridor.lower()]
    return [_sacco_to_dict(s) for s in results]


def get_sacco_by_id(sacco_id: str) -> Optional[dict]:
    """Get a specific SACCO"""
    sacco = SACCO_MAP.get(sacco_id)
    return _sacco_to_dict(sacco) if sacco else None


def get_saccos_for_route(route_number: str) -> List[dict]:
    """Get SACCOs operating a specific route"""
    results = [s for s in SACCO_OPERATORS if route_number in s.routes]
    return [_sacco_to_dict(s) for s in results]


def get_intercity_routes(from_city: Optional[str] = None) -> List[dict]:
    """Get intercity routes"""
    results = INTERCITY_ROUTES
    if from_city:
        results = [r for r in results if r["from"].lower() == from_city.lower()]
    return results


def get_route_hotspots(route: Optional[str] = None) -> List[dict]:
    """Get crash hotspots, optionally filtered by route"""
    results = ROUTE_HOTSPOTS
    if route:
        results = [h for h in results if h["route"] == route]
    return results


def search_routes(query: str) -> List[dict]:
    """Search routes by destination, corridor, or stage"""
    query = query.lower()
    results = []
    for r in PSV_ROUTES:
        if (query in r.destination.lower() or
            query in r.corridor.lower() or
            query in r.cbd_stage.lower() or
            any(query in s.lower() for s in r.key_stages)):
            results.append(_route_to_dict(r))
    return results


def get_fare_estimate(route_number: str) -> Optional[dict]:
    """Get fare estimate for a route"""
    routes = PSV_ROUTES_BY_NUMBER.get(route_number, [])
    if not routes:
        return None
    r = routes[0]
    return {
        "route_number": route_number,
        "destination": r.destination,
        "fare_min_ksh": r.fare_min_ksh,
        "fare_max_ksh": r.fare_max_ksh,
        "distance_km": r.distance_km,
        "estimated_time_min": int(r.distance_km / 0.5),  # ~30 km/h average
    }


def get_network_summary() -> dict:
    """Get summary of the entire PSV network"""
    return {
        "total_routes": len(PSV_ROUTES),
        "total_stages": len(CBD_STAGES),
        "total_saccos": len(SACCO_OPERATORS),
        "intercity_routes": len(INTERCITY_ROUTES),
        "crash_hotspots": len(ROUTE_HOTSPOTS),
        "lines": {
            line.value: len([r for r in PSV_ROUTES if r.line == line.value])
            for line in RouteLine
        },
        "stage_coverage": {
            s.name: len(s.routes) for s in CBD_STAGES
        },
        "electric_saccos": len([s for s in SACCO_OPERATORS if s.is_electric]),
    }


def _route_to_dict(r: PSVRoute) -> dict:
    return {
        "route_id": r.route_id,
        "route_number": r.route_number,
        "line": r.line,
        "corridor": r.corridor,
        "cbd_stage": r.cbd_stage,
        "origin": r.origin,
        "destination": r.destination,
        "key_stages": r.key_stages,
        "fare_min_ksh": r.fare_min_ksh,
        "fare_max_ksh": r.fare_max_ksh,
        "distance_km": r.distance_km,
        "vehicle_type": r.vehicle_type,
        "latitude": r.latitude,
        "longitude": r.longitude,
    }


def _sacco_to_dict(s: SACCO) -> dict:
    return {
        "sacco_id": s.sacco_id,
        "name": s.name,
        "full_name": s.full_name,
        "routes": s.routes,
        "primary_corridor": s.primary_corridor,
        "cbd_stage": s.cbd_stage,
        "fleet_estimate": s.fleet_estimate,
        "vehicle_type": s.vehicle_type,
        "famous_vehicles": s.famous_vehicles,
        "founded_year": s.founded_year,
        "is_electric": s.is_electric,
    }
