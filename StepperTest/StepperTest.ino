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
#include <Adafruit_INA219.h>

SoftwareSerial readSerial(10, 11);

// LoRa :
// Set your AppEUI and AppKey
const char *appEui = "70B3D57ED003B050";
const char *appKey = "93A6F6E2C974B0C09D66073F8B43B01E";

#define loraSerial Serial1
#define debugSerial Serial
#define freqPlan TTN_FP_EU868

unsigned long wait;
unsigned power = 100;
unsigned targetTemp = 20;

byte i = 0;

TheThingsNetwork ttn(loraSerial, debugSerial, freqPlan);
Adafruit_INA219 powerSensor;

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

  // On ne peut envoyer que des bytes en LoRa donc on créé un tableau de bytes :
  byte envoi[4];

  envoi[0] = highByte(production);
  envoi[1] = lowByte(production);

  envoi[2] = highByte(temp);
  envoi[3] = lowByte(temp);

  ttn.sendBytes(envoi, sizeof(envoi));

}


// Transforme les données du capteur de temp en degrés
float readTemp() {
  int valeur_brute = analogRead(TEMP);
  float temperature = valeur_brute * (5.0 / 1023 * 100.0);
  return temperature;
}

void callbackLora(const uint8_t *payload, size_t size, port_t port) {

  Serial.println("Message received");

  char p[10];
  sprintf(p, "%d", payload[0]);

  debugSerial.println(p);

  // Regarde le premier byte du payload qu'il reçoit :
  if (payload[0] < 4) {
    if (payload[0] == 1) trackAuto = !trackAuto;
    else if (payload[0] == 2) sendInfo = !sendInfo;
    else if (payload[0] == 3) sendPower = !sendPower;
  } else {
    Serial.print("more");
    targetTemp = payload[0];
  }

  delay(500);
}

// Fonction de récupération de valeur du capteur de courant :
unsigned int getPower() {

  float shuntvoltage = powerSensor.getShuntVoltage_mV();
  float busvoltage = powerSensor.getBusVoltage_V();
  float current_mA = powerSensor.getCurrent_mA();
  float loadvoltage = busvoltage + (shuntvoltage / 1000);

  Serial.print("Bus Voltage: "); Serial.print(busvoltage); Serial.println(" V");
  Serial.print("Shunt Voltage: "); Serial.print(shuntvoltage); Serial.println(" mV");
  Serial.print("Load Voltage: "); Serial.print(loadvoltage); Serial.println(" V");
  Serial.print("Current: "); Serial.print(current_mA); Serial.println(" mA");
  Serial.println("");

  return (int) current_mA * loadvoltage;
}

unsigned getRandomPower(unsigned power) {
  if(power > 0) {
    bool up = random(0, 1);
    if(power < 50 || up) {
      power += random(5, 10);
    } else {
      power -= random(5, 10);
    }
  }
  return power;
}

// Fonction qui suit le soleil en fonction des données des photorésistances :
void tracker() {

  // X :
  if ((topLeft + topRight + SENSIBILITY) < (bottomLeft + bottomRight)) {
    Serial.println("X LEFT");
    rotate(X, 10, DEGRES, FOR);
  }
  else if ((topLeft + topRight) > (bottomLeft + bottomRight + SENSIBILITY)) {
    Serial.println("X RIGHT");
    rotate(X, 10, DEGRES, BACK);
  }

  // Y :
  if ((topLeft + bottomLeft + SENSIBILITY) < (topRight + bottomRight)) {
    Serial.println("Y LEFT");
    rotate(Y, 10, DEGRES, FOR);
  }
  else if ((topLeft + bottomLeft) > (topRight + bottomRight + SENSIBILITY)) {
    Serial.println("Y RIGHT");
    rotate(X, 10, DEGRES, BACK);
  }

}

// Fonction pour pouvoir faire bouger les moteures comme on le souhaite
void rotate(bool motor, byte speed, unsigned int degree, bool sens) {
  if (motor) {
    motorX->setSpeed(speed);
    motorX->step(degree, sens ? FORWARD : BACKWARD, SINGLE);
  } else {
    motorY->setSpeed(speed);
    motorY->step(degree, sens ? FORWARD : BACKWARD, SINGLE);
  }
}

// Chauffe si le capteur de température est plus bas que la température voulue.
void heat() {
  if ((int)readTemp < targetTemp) digitalWrite(RELAIS, true);
}

void readSensors() {
  char buff[20 + 1];

  //memset(buff, 0, sizeof(buff));

  Serial.println("Read serial sensors");

  Serial.println(readSerial.available());

  while (readSerial.available() > 0 && (buff[i] = readSerial.read()) != '\n' && i < 20) {
    //buff[i] = readSerial.read();
    i++;
  }
  if (buff[i] == '\n') { // End of message
    buff[i] = '\0';

    byte j = 0;
    i = 0;
    char buff2[4];

    // Split message :
    while (buff[i] != ':') {
      buff2[j] = buff[i];
      j++;
      i++;
    }
    buff2[j] = '\0';
    topLeft = atoi(buff2);
    i++;
    j = 0;

    while (buff[i] != ':') {
      buff2[j] = buff[i];
      j++;
      i++;
    }
    buff2[j] = '\0';
    topRight = atoi(buff2);
    i++;
    j = 0;

    while (buff[i] != ':') {
      buff2[j] = buff[i];
      j++;
      i++;
    }
    buff2[j] = '\0';
    bottomLeft = atoi(buff2);
    i++;
    j = 0;

    while (buff[i] != ':') {
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

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  Serial.println("Stepper test!");

  //pinMode(POWER_SENSOR, INPUT);

  pinMode(RELAIS, OUTPUT);
  pinMode(TEMP, INPUT);
  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);

  //digitalWrite(TEMP, false);

  loraSerial.begin(57600);
  debugSerial.begin(115200);

  readSerial.begin(9600);
  powerSensor.begin();

  ttn.reset(true);

  delay(50);

  debugSerial.println("-- STATUS");
  ttn.showStatus();
  debugSerial.println("-- JOIN");
  ttn.join(appEui, appKey, 8, 10);
  ttn.onMessage(callbackLora);

  AFMS.begin();  // create with the default frequency 1.6KHz
  //AFMS.begin(1000);  // OR with a different frequency, say 1KHz
  wait = (int) millis() / 10000;

}

void loop() {

  Serial.println("=================");
  Serial.println();

  // Si le tracker de soleil est activé, on lit les photorésistances et on lance le tracker suivant les valeures obtenues :
  if (trackAuto) {
    readSensors();
    tracker();
  }

  // Si la fonction de suivie de température est activée, on lance la fonction de chauffage :
  if (sendPower) heat();
  else digitalWrite(RELAIS, 0);

  digitalWrite(RELAIS, sendPower);

  // Attend 10 secondes sans délais :
  if (millis() > wait + 10000) {
    wait = millis();
    Serial.print("wait : "); Serial.println(wait);
    power = getRandomPower(power);
    loraSend(sendInfo ? power : 0, readTemp());
  }

  //Serial.print("Power : "); Serial.println(analogRead(POWER_SENSOR));

  Serial.print("Temp voulue : "); Serial.println(targetTemp);
  Serial.print("Temp : "); Serial.println(readTemp());

  delay(250);

  digitalWrite(RELAIS, sendPower);

}
