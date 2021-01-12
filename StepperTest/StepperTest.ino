 /* 
This is a test sketch for the Adafruit assembled Motor Shield for Arduino v2
It won't work with v1.x motor shields! Only for the v2's with built in PWM
control

For use with the Adafruit Motor Shield v2 
---->	http://www.adafruit.com/products/1438
*/
#include <SoftwareSerial.h>

#include <Wire.h>
#include <Adafruit_MotorShield.h>
#include <TheThingsNetwork.h>

SoftwareSerial readSerial(10, 11); 

// LoRa :
// Set your AppEUI and AppKey
const char *appEui = "70B3D57ED003B050";
const char *appKey = "93A6F6E2C974B0C09D66073F8B43B01E";

#define loraSerial Serial1
#define debugSerial Serial
#define freqPlan TTN_FP_EU868

long int wait = 0;
int targetTemp = 20;

byte i = 0;

TheThingsNetwork ttn(loraSerial, debugSerial, freqPlan);

///////////

#define SENSIBILITY 100

#define DEGRES 10

#define X true
#define Y false

uint16_t topLeft = 0;
uint16_t topRight = 0;

uint16_t bottomLeft = 0;
uint16_t bottomRight = 0;

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
  if((topLeft + topRight + SENSIBILITY) < (bottomLeft + bottomRight)) {
    Serial.println("X LEFT");
    rotate(X, 10, DEGRES, FOR);
  }
  else if((topLeft + topRight) > (bottomLeft + bottomRight + SENSIBILITY)) {
    Serial.println("X RIGHT");
    rotate(X, 10, DEGRES, BACK);
  }

  // Y :
  if((topLeft + bottomLeft + SENSIBILITY) < (topRight + bottomRight)) {
    Serial.println("Y LEFT");
    rotate(Y, 10, DEGRES, FOR);
  }
  else if((topLeft + bottomLeft) > (topRight + bottomRight + SENSIBILITY)) {
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

  pinMode(RELAIS, OUTPUT);
  pinMode(TEMP, INPUT);

  //digitalWrite(TEMP, false);

  loraSerial.begin(57600);
  debugSerial.begin(115200);

  readSerial.begin(9600);

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

void readSensors() {
    char buff[20 + 1];

    //memset(buff, 0, sizeof(buff));
    
    Serial.println("Read serial sensors");

    Serial.println(readSerial.available());
    
    while(readSerial.available() > 0 && (buff[i] = readSerial.read()) != '\n' && i < 20) {
        //buff[i] = readSerial.read();
        i++;
    }
    if(buff[i] == '\n') { // End of message
      buff[i] = '\0';
      
      byte j = 0;
      i = 0;
      char buff2[4];

      while(buff[i] != ':') {
        buff2[j] = buff[i];
        j++;
        i++;
      }
      buff2[j] = '\0';
      topLeft = atoi(buff2);
      i++;
      j = 0;

      while(buff[i] != ':') {
        buff2[j] = buff[i];
        j++;
        i++;
      }
      buff2[j] = '\0';
      topRight = atoi(buff2);
      i++;
      j = 0;
      
      while(buff[i] != ':') {
        buff2[j] = buff[i];
        j++;
        i++;
      }
      buff2[j] = '\0';
      bottomLeft = atoi(buff2);
      i++;
      j = 0;

      while(buff[i] != ':') {
        buff2[j] = buff[i];
        j++;
        i++;
      }
      buff2[j] = '\0';
      bottomRight = atoi(buff2);
      i++;
      
      Serial.print("Sensors : "); Serial.println(buff);
      i = 0;
    }
}

void loop() {

  Serial.println("=================");
  Serial.println();

  if(trackAuto) {

    readSensors();
    tracker();
  }

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
