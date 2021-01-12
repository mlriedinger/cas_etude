 /* 
This is a test sketch for the Adafruit assembled Motor Shield for Arduino v2
It won't work with v1.x motor shields! Only for the v2's with built in PWM
control

For use with the Adafruit Motor Shield v2 
---->	http://www.adafruit.com/products/1438
*/


#include <Wire.h>
#include <Adafruit_MotorShield.h>
#include <TheThingsNetwork.h>

// LoRa :
// Set your AppEUI and AppKey
const char *appEui = "70B3D57ED003B050";
const char *appKey = "93A6F6E2C974B0C09D66073F8B43B01E";

#define loraSerial Serial1
#define debugSerial Serial
#define freqPlan TTN_FP_EU868

long int wait = 0;
int targetTemp = 20;

TheThingsNetwork ttn(loraSerial, debugSerial, freqPlan);

///////////

#define SENSIBILITY 100

#define DEGRES 10

#define X true
#define Y false

#define TOP_LEFT A1
#define TOP_RIGHT A2
#define BOTTOM_LEFT A3
#define BOTTOM_RIGHT A4

#define TEMP A0

//#define POWER_SENSOR A0

#define RELAIS 7

#define FOR true
#define BACK false

// Create the motor shield object with the default I2C address
Adafruit_MotorShield AFMS = Adafruit_MotorShield(); 
// Or, create it with a different I2C address (say for stacking)
// Adafruit_MotorShield AFMS = Adafruit_MotorShield(0x61); 

// Connect a stepper motor with 200 steps per revolution (1.8 degree)
// to motor port #2 (M3 and M4)
Adafruit_StepperMotor *motorX = AFMS.getStepper(200, 2);
Adafruit_StepperMotor *motorY = AFMS.getStepper(200, 1);

bool trackAuto = true;
bool sendInfo = true;
bool sendPower = true;

void loraSend(uint32_t production, uint32_t temp) {

  
  Serial.println(production);
  Serial.println(sizeof(production));

  byte envoi[4];

  envoi[0] = highByte(production);
  envoi[1] = lowByte(production);

  envoi[2] = highByte(temp);
  envoi[3] = lowByte(temp);
  
  ttn.sendBytes(envoi, sizeof(envoi));

  wait = millis();

//  delay(10000);
}

float readTemp() {
  int valeur_brute = analogRead(TEMP);
  float temperature = valeur_brute * (5.0 / 1023 * 100.0);
  return temperature;
}

void callbackLora(const uint8_t *payload, size_t size, port_t port) {

  Serial.println("Message received");
  debugSerial.println(payload[0]);

  if(payload[0] < 4) {
    if (payload[0] == 1) trackAuto = !trackAuto;
    else if (payload[0] == 2) sendInfo = !sendInfo;
    else if (payload[0] == 3) sendPower = !sendPower;
  } else {
    Serial.print("more");
    targetTemp = payload[0];
  }

  delay(500);
}

void tracker() {

  // X :
  if((analogRead(TOP_LEFT) + analogRead(TOP_RIGHT) + SENSIBILITY) < (analogRead(BOTTOM_LEFT) + analogRead(BOTTOM_RIGHT))) {
    Serial.println("X LEFT");
    rotate(X, 10, DEGRES, FOR);
  }
  else if((analogRead(TOP_LEFT) + analogRead(TOP_RIGHT)) > (analogRead(BOTTOM_LEFT) + analogRead(BOTTOM_RIGHT) + SENSIBILITY)) {
    Serial.println("X RIGHT");
    rotate(X, 10, DEGRES, BACK);
  }

  // Y :
  if((analogRead(TOP_LEFT) + analogRead(BOTTOM_LEFT) + SENSIBILITY) < (analogRead(TOP_RIGHT) + analogRead(BOTTOM_RIGHT))) {
    Serial.println("Y LEFT");
    rotate(Y, 10, DEGRES, FOR);
  }
  else if((analogRead(TOP_LEFT) + analogRead(BOTTOM_LEFT)) > (analogRead(TOP_RIGHT) + analogRead(BOTTOM_RIGHT) + SENSIBILITY)) {
    Serial.println("Y RIGHT");
    rotate(X, 10, DEGRES, BACK);
  }
  
}

void rotate(bool motor, byte speed, unsigned int degree, bool sens) {
  if(motor) {
    motorX->setSpeed(speed);
    motorX->step(degree, sens ? FORWARD : BACKWARD, SINGLE);
  } else {
    motorY->setSpeed(speed);
    motorY->step(degree, sens ? FORWARD : BACKWARD, SINGLE);
  }
}

void heat() {
  if(readTemp < targetTemp) digitalWrite(RELAIS, true);
}

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  Serial.println("Stepper test!");

  //pinMode(POWER_SENSOR, INPUT);
  
  pinMode(TOP_LEFT, INPUT);
  pinMode(TOP_RIGHT, INPUT);
  pinMode(BOTTOM_LEFT, INPUT);
  pinMode(BOTTOM_RIGHT, INPUT);

  pinMode(RELAIS, OUTPUT);
  pinMode(TEMP, INPUT);

  //digitalWrite(TEMP, false);

  loraSerial.begin(57600);
  debugSerial.begin(115200);

  ttn.reset(true);

  delay(50);

  debugSerial.println("-- STATUS");
  ttn.showStatus();
  debugSerial.println("-- JOIN");
  ttn.join(appEui, appKey, 8, 10);
  ttn.onMessage(callbackLora);

  AFMS.begin();  // create with the default frequency 1.6KHz
  //AFMS.begin(1000);  // OR with a different frequency, say 1KHz
  
}

void loop() {

//  Serial.println("Single coil steps");
//  rotate(X, 100, 360, FOR);
//  Serial.println("Finish for");
//  rotate(Y, 100, 360, BACK);
//  Serial.println("Finish back");

  Serial.print("Top left : "); Serial.println(analogRead(TOP_LEFT));
  Serial.print("Top right : "); Serial.println(analogRead(TOP_RIGHT));
  Serial.print("Bottom left : "); Serial.println(analogRead(BOTTOM_LEFT));
  Serial.print("Bottom right : "); Serial.println(analogRead(BOTTOM_RIGHT));

  Serial.println("=================");
  Serial.println();

  if(trackAuto) tracker();

  if(sendPower) heat();
  else digitalWrite(RELAIS, 0);
  
  digitalWrite(RELAIS, sendPower);
  
  if(millis() > wait + 10000) {
    loraSend(sendInfo ? random(0, 254) : 0, readTemp());
  }

  //Serial.print("Power : "); Serial.println(analogRead(POWER_SENSOR));

  Serial.print("Temp voulue : "); Serial.println(targetTemp);
  Serial.print("Temp : "); Serial.println(readTemp());

  delay(250);

  digitalWrite(RELAIS, sendPower);

} 
