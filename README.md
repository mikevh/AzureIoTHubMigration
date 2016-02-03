# AzureIoTHubMigration
Project hosting web service and device client application. Demonstrates how to support both Nitrogen IoT Framework and Azure IoT Framework. Technologies: Node.js JADE, Express, Mongo, Azure IoT Hub Nitrogen


## Install 
Go to the subdirectories and:

npm install

node main.js or node app.js

## Configure

Select Azure IoT Hub or Nitrogen.io IoT framework and configure web and device projects. 

In case of Azure IoT Hub, connection strings for device and iothubowner are needed and also for event hub message receiver, some other details that can be found from Azure Management portal.

In case of Nitrogen, config files need api key, nitrogen service host, protocol and port.

For additional configuration help, check http://appelfish.cloudapp.net/ blog, http://nitrogen.io or https://azure.microsoft.com/en-us/services/iot-hub

## Features

Device software can be controlled to make some operation from web page and web page can show all devices for authenticated users. Admin can also manage users and visible devices in case of Azure IoT Hub.
