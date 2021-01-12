#include <SoftwareSerial.h>

#define TOP_LEFT A0
#define TOP_RIGHT A1
#define BOTTOM_LEFT A2
#define BOTTOM_RIGHT A3

SoftwareSerial sendSerial(10, 11); 

void setup() {
  // put your setup code here, to run once:
  pinMode(TOP_LEFT, INPUT);
  pinMode(TOP_RIGHT, INPUT);
  pinMode(BOTTOM_LEFT, INPUT);
  pinMode(BOTTOM_RIGHT, INPUT);

  Serial.begin(115200);
  sendSerial.begin(9600);

}

void loop() {
  // put your main code here, to run repeatedly:

  char buff[20];

  uint16_t topLeft = analogRead(TOP_LEFT);
  uint16_t topRight = analogRead(TOP_RIGHT);
  
  uint16_t bottomLeft = analogRead(BOTTOM_LEFT); 
  uint16_t bottomRight = analogRead(BOTTOM_RIGHT);
  
  Serial.print("Top left : "); Serial.println(topLeft);
  Serial.print("Top right : "); Serial.println(topRight);

  Serial.print("Bottom left : "); Serial.println(bottomLeft);
  Serial.print("Bottom right : "); Serial.println(bottomRight);

  sprintf(buff, "%i:%i:%i:%i", topLeft, topRight, bottomLeft, bottomRight);
  //sprintf(buff, "%i:%i:%i:%i", 111, 222, 333, 444);
  sendSerial.println(buff);

  Serial.println(sizeof(buff));

  delay(1000);

  //Serial.println(buff);
}
