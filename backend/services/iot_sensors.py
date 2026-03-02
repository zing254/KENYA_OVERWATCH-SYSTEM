"""
IoT Sensor Integration (MQTT)
Receives data from road sensors (temperature, vibration, weather)
"""

import logging
import json
import asyncio
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from datetime import datetime, timezone
import random

logger = logging.getLogger(__name__)


@dataclass
class SensorReading:
    """Reading from a road sensor"""
    sensor_id: str
    sensor_type: str  # temperature, vibration, weather, traffic
    latitude: float
    longitude: float
    value: float
    unit: str
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Dict = field(default_factory=dict)


@dataclass
class SensorConfig:
    """Configuration for a sensor"""
    sensor_id: str
    sensor_type: str
    location: Dict[str, float]
    road_name: str
    county: str
    enabled: bool = True
    reporting_interval_seconds: int = 60
    alert_thresholds: Dict[str, float] = field(default_factory=dict)


class MQTTSensorService:
    """
    MQTT-based IoT sensor service for road condition monitoring
    
    Handles:
    - Temperature sensors (road surface temperature)
    - Vibration sensors (detect accidents, heavy vehicles)
    - Weather sensors (rain, fog, wind)
    - Traffic flow sensors (vehicle count, speed)
    
    In production, this would connect to an MQTT broker (e.g., Mosquitto)
    """
    
    def __init__(self, mqtt_broker: str = "localhost", mqtt_port: int = 1883):
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        
        self.sensors: Dict[str, SensorConfig] = {}
        self.readings: Dict[str, List[SensorReading]] = {}
        self.subscribers: List[Callable] = []
        
        # MQTT topics
        self.base_topic = "kenya-overwatch/sensors"
        self.topics = {
            "temperature": f"{self.base_topic}/temperature/+",
            "vibration": f"{self.base_topic}/vibration/+",
            "weather": f"{self.base_topic}/weather/+",
            "traffic": f"{self.base_topic}/traffic/+"
        }
        
        # Connection state
        self.connected = False
        self.client = None
        
        # Background task
        self._simulation_task = None
        self._simulation_enabled = False
    
    async def connect(self) -> bool:
        """Connect to MQTT broker"""
        try:
            # In production, would use aiomqtt or similar
            # import aiomqtt
            # self.client = aiomqtt.Client(self.mqtt_broker, self.mqtt_port)
            # await self.client.connect()
            
            self.connected = True
            logger.info(f"Connected to MQTT broker at {self.mqtt_broker}:{self.mqtt_port}")
            return True
        except Exception as e:
            logger.warning(f"MQTT connection failed, using simulation: {e}")
            self.connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from MQTT broker"""
        self.connected = False
        if self._simulation_task:
            self._simulation_task.cancel()
        logger.info("Disconnected from MQTT broker")
    
    def register_sensor(self, config: SensorConfig):
        """Register a new sensor"""
        self.sensors[config.sensor_id] = config
        self.readings[config.sensor_id] = []
        logger.info(f"Registered sensor: {config.sensor_id} ({config.sensor_type})")
    
    def unregister_sensor(self, sensor_id: str):
        """Unregister a sensor"""
        if sensor_id in self.sensors:
            del self.sensors[sensor_id]
        if sensor_id in self.readings:
            del self.readings[sensor_id]
        logger.info(f"Unregistered sensor: {sensor_id}")
    
    async def handle_message(self, topic: str, payload: str):
        """Handle incoming MQTT message"""
        
        try:
            data = json.loads(payload)
            
            # Parse topic to get sensor info
            topic_parts = topic.split('/')
            sensor_type = topic_parts[2] if len(topic_parts) > 2 else "unknown"
            sensor_id = topic_parts[3] if len(topic_parts) > 3 else data.get("sensor_id", "unknown")
            
            reading = SensorReading(
                sensor_id=sensor_id,
                sensor_type=sensor_type,
                latitude=data.get("latitude", 0.0),
                longitude=data.get("longitude", 0.0),
                value=data.get("value", 0.0),
                unit=data.get("unit", ""),
                metadata=data.get("metadata", {})
            )
            
            # Store reading
            if sensor_id not in self.readings:
                self.readings[sensor_id] = []
            self.readings[sensor_id].append(reading)
            
            # Keep last 1000 readings
            if len(self.readings[sensor_id]) > 1000:
                self.readings[sensor_id] = self.readings[sensor_id][-1000:]
            
            # Check thresholds and alert
            await self._check_alerts(reading)
            
            # Notify subscribers
            for callback in self.subscribers:
                try:
                    callback(reading)
                except Exception as e:
                    logger.error(f"Subscriber callback error: {e}")
            
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON in MQTT message: {payload}")
        except Exception as e:
            logger.error(f"Error handling MQTT message: {e}")
    
    async def _check_alerts(self, reading: SensorReading):
        """Check if reading triggers any alerts"""
        
        sensor_id = reading.sensor_id
        if sensor_id not in self.sensors:
            return
        
        config = self.sensors[sensor_id]
        
        if not config.alert_thresholds:
            return
        
        for threshold_name, threshold_value in config.alert_thresholds.items():
            if threshold_name == "max" and reading.value > threshold_value:
                logger.warning(
                    f"Alert: Sensor {sensor_id} exceeded max threshold "
                    f"({reading.value} {reading.unit} > {threshold_value})"
                )
            elif threshold_name == "min" and reading.value < threshold_value:
                logger.warning(
                    f"Alert: Sensor {sensor_id} below min threshold "
                    f"({reading.value} {reading.unit} < {threshold_value})"
                )
    
    def subscribe(self, callback: Callable[[SensorReading], None]):
        """Subscribe to sensor readings"""
        self.subscribers.append(callback)
    
    def unsubscribe(self, callback: Callable):
        """Unsubscribe from sensor readings"""
        if callback in self.subscribers:
            self.subscribers.remove(callback)
    
    def get_readings(
        self,
        sensor_id: Optional[str] = None,
        sensor_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict]:
        """Get sensor readings"""
        
        results = []
        
        if sensor_id:
            readings = self.readings.get(sensor_id, [])
            results = [self._reading_to_dict(r) for r in readings[-limit:]]
        else:
            for sid, readings in self.readings.items():
                if sensor_type:
                    sensor = self.sensors.get(sid)
                    if not sensor or sensor.sensor_type != sensor_type:
                        continue
                
                for r in readings[-limit:]:
                    results.append(self._reading_to_dict(r))
        
        return results
    
    def _reading_to_dict(self, reading: SensorReading) -> Dict:
        return {
            "sensor_id": reading.sensor_id,
            "sensor_type": reading.sensor_type,
            "latitude": reading.latitude,
            "longitude": reading.longitude,
            "value": reading.value,
            "unit": reading.unit,
            "timestamp": reading.timestamp.isoformat(),
            "metadata": reading.metadata
        }
    
    def get_sensors(
        self,
        sensor_type: Optional[str] = None,
        enabled_only: bool = False
    ) -> List[Dict]:
        """Get registered sensors"""
        
        results = []
        
        for sensor_id, config in self.sensors.items():
            if sensor_type and config.sensor_type != sensor_type:
                continue
            if enabled_only and not config.enabled:
                continue
            
            results.append({
                "sensor_id": config.sensor_id,
                "sensor_type": config.sensor_type,
                "latitude": config.location.get("lat", 0.0),
                "longitude": config.location.get("lng", 0.0),
                "road_name": config.road_name,
                "county": config.county,
                "enabled": config.enabled,
                "alert_thresholds": config.alert_thresholds
            })
        
        return results
    
    async def start_simulation(self):
        """Start simulated sensor data (for testing)"""
        
        self._simulation_enabled = True
        
        # Register some default sensors
        default_sensors = [
            SensorConfig(
                sensor_id="temp_001",
                sensor_type="temperature",
                location={"lat": -1.3300, "lng": 36.9800},
                road_name="Mombasa Road",
                county="Nairobi",
                alert_thresholds={"max": 60.0, "min": -10.0}
            ),
            SensorConfig(
                sensor_id="vib_001",
                sensor_type="vibration",
                location={"lat": -1.2000, "lng": 37.1000},
                road_name="Thika Superhighway",
                county="Nairobi",
                alert_thresholds={"max": 100.0}
            ),
            SensorConfig(
                sensor_id="weather_001",
                sensor_type="weather",
                location={"lat": -1.2864, "lng": 36.8232},
                road_name="Kenyatta Avenue",
                county="Nairobi",
                alert_thresholds={"max": 50.0}  # rainfall mm/h
            ),
        ]
        
        for sensor in default_sensors:
            self.register_sensor(sensor)
        
        # Generate simulated readings
        async def generate_readings():
            while self._simulation_enabled:
                for sensor_id, config in self.sensors.items():
                    value = self._generate_sensor_value(config.sensor_type)
                    
                    reading = SensorReading(
                        sensor_id=sensor_id,
                        sensor_type=config.sensor_type,
                        latitude=config.location.get("lat", 0.0),
                        longitude=config.location.get("lng", 0.0),
                        value=value,
                        unit=self._get_unit(config.sensor_type)
                    )
                    
                    if sensor_id not in self.readings:
                        self.readings[sensor_id] = []
                    self.readings[sensor_id].append(reading)
                    
                    # Notify subscribers
                    for callback in self.subscribers:
                        try:
                            callback(reading)
                        except Exception as e:
                            logger.error(f"Subscriber error: {e}")
                
                await asyncio.sleep(10)  # Every 10 seconds
        
        self._simulation_task = asyncio.create_task(generate_readings())
        logger.info("Started sensor simulation")
    
    def stop_simulation(self):
        """Stop sensor simulation"""
        self._simulation_enabled = False
        if self._simulation_task:
            self._simulation_task.cancel()
        logger.info("Stopped sensor simulation")
    
    def _generate_sensor_value(self, sensor_type: str) -> float:
        """Generate simulated sensor value"""
        
        if sensor_type == "temperature":
            return random.uniform(15.0, 35.0)  # Celsius
        elif sensor_type == "vibration":
            return random.uniform(0.0, 50.0)
        elif sensor_type == "weather":
            return random.uniform(0.0, 10.0)  # mm rain
        elif sensor_type == "traffic":
            return random.randint(0, 100)  # vehicle count
        else:
            return random.uniform(0.0, 100.0)
    
    def _get_unit(self, sensor_type: str) -> str:
        """Get unit for sensor type"""
        
        units = {
            "temperature": "°C",
            "vibration": "m/s²",
            "weather": "mm/h",
            "traffic": "vehicles/hour"
        }
        return units.get(sensor_type, "")


# Global MQTT sensor service
mqtt_sensor_service = MQTTSensorService()
