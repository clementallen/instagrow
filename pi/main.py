import ssl
import json
import time
import ntptime
import network
import machine
import ubinascii
from dht11 import *
from simple import MQTTClient
from machine import Pin, Timer, ADC

temp_humidity = DHT(18) #temperature and humidity sensor connect to D18 port
moisture = ADC(0)
pump_relay = Pin(20, Pin.OUT)

# Wi-Fi network constants
#  WIFI_SSID = "Starlink 2.4GHz"
#  WIFI_PASSWORD = "Instagrow30"
WIFI_SSID = "Starlink 2.4GHz"
WIFI_PASSWORD = "Instagrow30"

# MQTT client and broker constants
MQTT_CLIENT_KEY = "team1-private.pem.key"
MQTT_CLIENT_CERT = "12da5fe95f06493a45fb6988ca201793885eb23bf816eaee5f82e4a81c645a3e-certificate.pem.crt"
MQTT_CLIENT_ID = ubinascii.hexlify(machine.unique_id())

MQTT_BROKER = "<broker_url>"
MQTT_BROKER_CA = "amazon-root-cert.pem.crt"

# MQTT topic constants
MQTT_LED_TOPIC = "instagrow/pi/to/led"
MQTT_INSTAGROW_TOPIC = "instagrow/pi/to"
MQTT_PUBLISH_TOPIC = "instagrow/pi/from"

# function that reads PEM file and return byte array of data
def read_pem(file):
    with open(file, "r") as input:
        text = input.read().strip()
        split_text = text.split("\n")
        base64_text = "".join(split_text[1:-1])

        return ubinascii.a2b_base64(base64_text)

# callback function to handle received MQTT messages
def on_mqtt_msg(topic, msg):
    # convert topic and message from bytes to string
    topic_str = topic.decode()
    msg_str = msg.decode()

    print(f"RX: {topic_str}\n{msg_str}\n")

    # process message
    if topic_str == MQTT_LED_TOPIC:
        if msg_str is "on":
            led.on()
        elif msg_str is "off":
            led.off()
        elif msg_str is "toggle":
            led.toggle()

    elif topic_str == MQTT_INSTAGROW_TOPIC:
        payload = json.loads(msg_str)

        if (payload.get("type") == "waterPlant"):
            duration = payload.get("duration")

            print(f"Running pump for {duration}ms\n")

            pump_relay.value(1)
            time.sleep(duration / 1000)
            pump_relay.value(0)

def publish_sensor_metrics(t):
    temperature,humidity = temp_humidity.readTempHumid()
    soilMoisture = moisture.read_u16()

    payload = {
        "temperature": temperature,
        "humidity": humidity,
        "soilMoisture": soilMoisture
    }

    print(f"TX: {MQTT_PUBLISH_TOPIC}\n{json.dumps(payload)}\n")

    mqtt_client.publish(MQTT_PUBLISH_TOPIC, json.dumps(payload))

# callback function to periodically send MQTT ping messages
# to the MQTT broker
def send_mqtt_ping(t):
    print("TX: ping")
    mqtt_client.ping()

# read the data in the private key, public certificate, and
# root CA files
key = read_pem(MQTT_CLIENT_KEY)
cert = read_pem(MQTT_CLIENT_CERT)
ca = read_pem(MQTT_BROKER_CA)

# create pin objects for on-board LED and external button
led = Pin("LED", Pin.OUT)

# initialize the Wi-Fi interface
wlan = network.WLAN(network.STA_IF)

# create MQTT client that use TLS/SSL for a secure connection
mqtt_client = MQTTClient(
    MQTT_CLIENT_ID,
    MQTT_BROKER,
    keepalive=60,
    ssl=True,
    ssl_params={
        "key": key,
        "cert": cert,
        "server_hostname": MQTT_BROKER,
        "cert_reqs": ssl.CERT_REQUIRED,
        "cadata": ca,
    },
)

print(f"Connecting to Wi-Fi SSID: {WIFI_SSID}")

# activate and connect to the Wi-Fi network:
wlan.active(True)
wlan.connect(WIFI_SSID, WIFI_PASSWORD)

while not wlan.isconnected():
    time.sleep(0.5)

print(f"Connected to Wi-Fi SSID: {WIFI_SSID}")

# update the current time on the board using NTP
ntptime.timeout = 20
ntptime.settime()

print(f"Connecting to MQTT broker: {MQTT_BROKER}")

# register callback to for MQTT messages, connect to broker and
# subscribe to LED topic
mqtt_client.set_callback(on_mqtt_msg)
mqtt_client.connect()
mqtt_client.subscribe(MQTT_LED_TOPIC)
mqtt_client.subscribe(MQTT_INSTAGROW_TOPIC)

print(f"Connected to MQTT broker: {MQTT_BROKER}")

# turn on-board LED on
led.on()

# create timer for periodic MQTT ping messages for keep-alive
mqtt_ping_timer = Timer(
    mode=Timer.PERIODIC, period=mqtt_client.keepalive * 1000, callback=send_mqtt_ping
)

publish_sensor_metrics("")

send_sensors_time = Timer(
    mode=Timer.PERIODIC, period=30 * 1000, callback=publish_sensor_metrics
)

# main loop, continuously check for incoming MQTT messages
while True:
    mqtt_client.check_msg()
