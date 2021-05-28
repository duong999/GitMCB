#include <DHT.h>
//#include <ArduinoJson.h>

#include <ESP8266WiFi.h>
#include <PubSubClient.h>


#define DHTTYPE DHT11 // DHT 11
const int DHTPin = 5;

#define led1 D3

DHT sensor(DHTPin, DHTTYPE);

const char* ssid = "CHUNG_DAT";
const char* password = "06239998";
//const char* ssid = "Tungduong";
//const char* password = "duong123";

//const char* ssid = "MT7628_AP";
//const char* password = "12345678";
const char* mqtt_server = "broker.hivemq.com";
const char* mqtt_username = "duongserver@!#";
const char* mqtt_password = "duong123";


WiFiClient mangcb;
PubSubClient client(mangcb);

unsigned long interval = 5000;
unsigned long previousMillis = 0;


void setup_wifi() {

  delay(100);
  
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void reconnect() {
  // loop toi khi ket noi toi mqtt
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    String clientId = "mangcb-";
    clientId += String(random(0xffff), HEX);
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}


// test json 
//char temp = 'on';
void callback(char* topic, byte* payload, unsigned int length) {
 Serial.print("nhan: ");
 Serial.println(topic);
 for(int i=0;i<length;i++){
  Serial.print((char) payload[i]);
 }
 if(char(payload[0]) == '1'){
  digitalWrite(led1, 0);
  Serial.print("\n bat");
 }else {
    digitalWrite(led1, 1);
    Serial.println("tat");
 }
 
}

  


void setup() {
  pinMode(led1, OUTPUT);     // Initialize the BUILTIN_LED pin as an output
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  reconnect();

  client.subscribe("duong/led_status");

  sensor.begin();
  
}

void loop() {
 
 int humidity = sensor.readHumidity();
 int temperature = sensor.readTemperature();
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

 

  
  
  

  if ((unsigned long)(millis() - previousMillis) >= interval) {
    previousMillis = millis();
    char tempString[8];
  sprintf(tempString, "%d",temperature);
  Serial.print("  Temperature: ");
  Serial.print(tempString);
  client.publish("home/sensors/temperature", tempString);
  
  char humString[8];
  sprintf(humString, "%d", humidity);
  Serial.print("  Humidity: ");
  Serial.println(humString);
  client.publish("home/sensors/humidity", humString);

  }
  client.loop();
  

}
