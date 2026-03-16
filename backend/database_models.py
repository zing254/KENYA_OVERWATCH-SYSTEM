from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


@dataclass
class User:
    id: str
    username: str
    email: str
    role: str


@dataclass
class Team:
    id: str
    name: str
    status: str
    base_location: str


@dataclass
class Alert:
    id: str
    severity: str
    message: str
    created_at: str


@dataclass
class Camera:
    id: str
    name: str
    location: str
    road_name: str


@dataclass
class RoadSegment:
    id: str
    name: str
    average_daily_traffic: int


class UserRole(Enum):
    ADMIN = "admin"
    OFFICER = "officer"
    CITIZEN = "citizen"


@dataclass
class Vehicle:
    plate_number: str


@dataclass
class Driver:
    license_number: str


@dataclass
class Accident:
    id: str


@dataclass
class Violation:
    id: str


# Aliases to satisfy backend/models/__init__.py imports
DBCamera = Camera
DBRoadSegment = RoadSegment
DBVehicle = Vehicle
DBDriver = Driver
DBAccident = Accident
DBViolation = Violation


class SeverityLevel(Enum):
    pass


class DBIncidentStatus(Enum):
    pass


class DBViolationStatus(Enum):
    pass


IncidentStatus = DBIncidentStatus
ViolationStatus = DBViolationStatus
