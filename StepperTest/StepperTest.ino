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
//#define DEBUG 1
#define TRACKER_X 1
//#define TRACKER_Y 1


unsigned long wait;
unsigned power = 100;
unsigned targetTemp = 20;
int posPanelX = 0;
int posPanelY = 0;

byte i = 0;

TheThingsNetwork ttn(loraSerial, debugSerial, freqPlan);
Adafruit_INA219 powerSensor;

///////////

#define SENSIBILITY 80

#define DEGRES 5

#define X true
#define Y false

uint16_t topLeft = 0;
uint16_t topRight = 0;

uint16_t bottomLeft = 0;
uint16_t bottomRight = 0;

#define TEMP A0
#define STOP_SENSOR_X A1
#define STOP_SENSOR_Y A2

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
bool sendHeat = false;


///////////////// LoRa //////////////////////

void loraSend(uint32_t production, uint32_t temp) {

  // On ne peut envoyer que des bytes en LoRa donc on créé un tableau de bytes :
  byte envoi[4];

  envoi[0] = highByte(production);
  envoi[1] = lowByte(production);

  envoi[2] = highByte(temp);
  envoi[3] = lowByte(temp);

  ttn.sendBytes(envoi, sizeof(envoi));

}

void callbackLora(const uint8_t *payload, size_t size, port_t port) {

#ifdef DEBUG
  Serial.println("Message received");

  char p[10];
  sprintf(p, "%d", payload[0]);

  debugSerial.println(p);
#endif

  // Regarde le premier byte du payload qu'il reçoit :
  if (payload[0] < 5) {
    if      (payload[0] == 1) trackAuto = !trackAuto;
    else if (payload[0] == 2) sendInfo = !sendInfo;
    else if (payload[0] == 3) sendHeat = !sendHeat;
    else if (payload[0] == 4) initPos();
  } else {
    Serial.print("more");
    targetTemp = payload[0];
  }

  delay(500);
}

///////////// Puissance //////////////////////

// Récupération de valeur du capteur de courant :
unsigned getPower() {

  float shuntvoltage;
  float busvoltage;
  float current_mA;
  float loadvoltage;
  float power_mW;
  
  shuntvoltage = abs(powerSensor.getShuntVoltage_mV());
  busvoltage = abs(powerSensor.getBusVoltage_V());
  current_mA = abs(powerSensor.getCurrent_mA());
  power_mW = abs(powerSensor.getPower_mW());
  loadvoltage = abs(busvoltage + (shuntvoltage / 1000));

  return round(current_mA * loadvoltage);
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


///////////// Chauffage ////////////////
// Transforme les données du capteur de temp en degrés
int readTemp() {
  int valTemperature = analogRead(TEMP);
  float volt = valTemperature * 5.0;
  volt = volt / 1024.0;
  return round((volt - 0.5) * 100);
}

// Chauffe si le capteur de température est plus bas que la température voulue.
void heat() {
  if (readTemp() < targetTemp) {
    digitalWrite(RELAIS, HIGH);
  } else if (readTemp() > targetTemp + 4) { // +4 = evite le jonglage entre allumé/éteint
    digitalWrite(RELAIS, LOW);
  }
}


///////////// Tracker ///////////////
// Suit le soleil en fonction des données de la trame envoyée par l'Uno :
void tracker() {

#ifdef DEBUG
  Serial.print("PosPanelY : "); Serial.println(posPanelY);  
  Serial.print("PosPanelX : "); Serial.println(posPanelX);
#endif

#ifdef TRACKER_X
  // X :
  if (((topLeft + topRight) > (bottomLeft + bottomRight + SENSIBILITY)) && posPanelX <= 160) {
#ifdef DEBUG
    Serial.println("X UP");
#endif
    posPanelX += DEGRES;
    rotate(X, 10, DEGRES, BACK);
  }
  else if (((topLeft + topRight) < (bottomLeft + bottomRight + SENSIBILITY)) && !isTouch(STOP_SENSOR_X)) {
#ifdef DEBUG
    Serial.println("X DOWN");
#endif
    posPanelX -= DEGRES;
    rotate(X, 10, DEGRES, FOR);
  }
#endif

#ifdef TRACKER_Y
  // Y :
  if ((topLeft + bottomLeft) < (topRight + bottomRight + SENSIBILITY) && posPanelY <= 400) {
#ifdef DEBUG
    Serial.println("Y LEFT");
#endif
    posPanelY += DEGRES;
    for(byte i = 0; i < DEGRES; i++) {
       rotate(Y, 254, DEGRES, FOR);
    }
  }
  else if ((topLeft + bottomLeft) > (topRight + bottomRight + SENSIBILITY) && !isTouch(STOP_SENSOR_Y)) {
#ifdef DEBUG
    Serial.println("Y RIGHT");
#endif
    posPanelY -= DEGRES;
    for(byte i = 0; i < DEGRES; i++) {
       rotate(Y, 254, DEGRES, BACK);  
    }
  }
#endif

  if(isTouch(STOP_SENSOR_X)) posPanelX = 0;
  if(isTouch(STOP_SENSOR_Y)) posPanelY = 0;
}

// Fait bouger les moteurs comme on le souhaite
void rotate(bool motor, uint8_t speed, unsigned int degree, bool sens) {
  if (motor) {
    motorX->setSpeed(speed);
    motorX->step(degree, sens ? FORWARD : BACKWARD, DOUBLE);
  } else {
    motorY->setSpeed(speed);
    motorY->step(degree, sens ? FORWARD : BACKWARD, DOUBLE);
  }
}

// Dit si un stop sensor est touché :
boolean isTouch(unsigned test) {
#ifdef DEBUG
  Serial.println(analogRead(test));
#endif
  if(analogRead(test) < 10 || analogRead(test) > 1000) return false;
  else return true;
}

// Initialise le panneaux en zéro X et zéro Y :
void initPos() {
#ifdef TRACKER_X
  while(!isTouch(STOP_SENSOR_X))  {
    rotate(X, 254, 1, FOR);
    delay(50);
  }
#endif

#ifdef TRACKER_Y
  while(!isTouch(STOP_SENSOR_Y)) {
    rotate(Y, 254, 1, BACK);
  }
#endif

  posPanelX = 0;
  posPanelY = 0;
}

// Split la trame envoyée par le Nano :
void readSensors() {
  char buff[20 + 1];

  //memset(buff, 0, sizeof(buff));
#ifdef DEBUG
  Serial.println("Read serial sensors");

  Serial.println(readSerial.available());
#endif

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
#ifdef DEBUG
    Serial.print("Sensors : "); Serial.println(buff);
#endif
    i = 0;
  }
}

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  //pinMode(POWER_SENSOR, INPUT);

  pinMode(RELAIS, OUTPUT);
  pinMode(TEMP, INPUT);
  pinMode(2, OUTPUT);
  pinMode(STOP_SENSOR_X, INPUT);
  pinMode(STOP_SENSOR_Y, INPUT);
  pinMode(0, OUTPUT);
  
  digitalWrite(STOP_SENSOR_X, HIGH);
  digitalWrite(STOP_SENSOR_Y, HIGH);
  
  digitalWrite(2, HIGH);
  digitalWrite(0, HIGH);

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

  initPos();

}

void loop() {

  // Si le tracker de soleil est activé, on lit les photorésistances et on lance le tracker suivant les valeures obtenues :
  if (trackAuto) {
    readSensors();
    tracker();
  }
  
  // Si le chauffage est activé, on lance la régulation de température :
  if (sendHeat) heat();
  else digitalWrite(RELAIS, 0);

  // Attend 10 secondes sans délais :
  if (millis() > wait + 10000) {
    wait = millis();
    power = getPower() * 10;
    loraSend(sendInfo ? power : 0, readTemp());
  }

#ifdef DEBUG
  Serial.println("=================");
  Serial.println();

  Serial.println(sendHeat ? "Chauffage allumé" : "Chauffage eteint");
  Serial.print("Temp voulue : "); Serial.println(targetTemp);
  Serial.print("Temp : "); Serial.println(readTemp());
#endif

  delay(250);

}
