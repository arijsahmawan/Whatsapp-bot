# Whatsapp bot

A simple Whatsapp bot create with Nodejs using [whiskeysockets/baileys](https://whiskeysockets.github.io/) library.

## Installation

1. Clone the repo
   ```sh
   git clone https://github.com/arijsahmawan/whatsapp-bot.git
   cd whatsapp-bot
   ```
2. Install the framework

   Using npm :
   ```sh 
   npm install whiskeysockets/baileys
   ```
   Using yarn :
   ```sh
   yarn add whiskeysockets/baileys
   ```
3. Enter your phone number in `phone_number.json` if you want to connect the bot using Pairing code
   ```json
   "pNumber": "ENTER YOUR PHONE NUMBER"
   ``` 
## Running
You can choose one

* Connect the whtsapp bot using qr code
  
   ```
   node index.js
   ```
* connect the whatsapp bot using Pairing code
  
   ```
   node index.js --useCode
   ```
## Feature
