
#include <HTTPClient.h>
#include <WiFi.h>

// WiFi Credentials
const char *ssid = "YOUR_WIFI_SSID";
const char *password = "YOUR_WIFI_PASSWORD";

// Supabase Configuration
const char *supabase_url =
    "https://uhrisaiemawrkxylwdcf.supabase.co/rest/v1/bin_alerts";
const char *supabase_key =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocmlzYWllbWF3cmt4eWx3ZGNmIiwicm9sZSI6Im"
    "Fub24iLCJpYXQiOjE3NzIwMzA2NjEsImV4cCI6MjA4NzYwNjY2MX0.MN6DaNC_k4QRvzbsAxI_"
    "f7EHZFKzSVr8BTCBfprX9H0";

// Sensor Pins
const int trigPin = 5;
const int echoPin = 18;
const int irPin = 19;

// Bin Configuration
const char *bin_id = "SMART_BIN_001";
const char *location = "MG Road, Sector 5";
const int full_threshold_cm = 15;

void setup() {
  Serial.begin(115200);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(irPin, INPUT);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

long getDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return duration * 0.034 / 2;
}

void sendAlert() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(supabase_url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabase_key);
    http.addHeader("Authorization", String("Bearer ") + supabase_key);

    String httpRequestData = "{\"bin_id\":\"" + String(bin_id) +
                             "\",\"location\":\"" + String(location) +
                             "\",\"status\":\"full\"}";
    int httpResponseCode = http.POST(httpRequestData);

    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

bool alertSent = false;

void loop() {
  long distance = getDistance();
  int irState = digitalRead(irPin);

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.print(" cm, IR State: ");
  Serial.println(irState);

  // If bin is full (Ultrasonic < 15cm AND IR detects obstruction)
  if (distance < full_threshold_cm &&
      irState == LOW) { // IR LOW usually means object detected
    if (!alertSent) {
      Serial.println("Bin is FULL! Sending alert...");
      sendAlert();
      alertSent = true;
    }
  } else {
    // Reset alert when bin is emptied
    if (distance > full_threshold_cm + 5) {
      alertSent = false;
    }
  }

  delay(5000); // Check every 5 seconds
}
