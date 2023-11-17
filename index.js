const {makeWASocket, MessageType, Mimetype, MessageOptions, useMultiFileAuthState} = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const rawData = require("./phone_number.json")
const useCode = process.argv.includes("--useCode")

async function connectToWhatsapp(){
  const auth = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    printQRInTerminal: !useCode,
    browser: ["Chrome (linux)", "", ""],
    auth: auth.state,
    logger: pino({level: "silent"})
  })
  if(useCode && !sock.authState.creds.registered){
    setTimeout(async function(){
      const pCode = await sock.requestPairingCode(rawData.pNumber)
      console.log("Pairing code : "+pCode)
    }, 5000)
  }
  sock.ev.on("creds.update", auth.saveCreds)
  sock.ev.on("connection.update", ({connection}) =>{
    if(connection === "open"){
      console.log("=====> Nomor WA yang terhubung: "+ sock.user.id.split(":")[0])
    }else if(connection === "close"){
      connectToWhatsapp()
    }
  })
  sock.ev.on("messages.upsert", ({messages}) =>{
    const msgs = messages[0]
    const msgId = msgs.key.remoteJid
    const msg = msgs.message.conversation
    //console.log(`${msgId.split("@")[0]} : ${msg}`)
    function reply(text){sock.sendMessage(msgId, { text: text }, {quoted: msgs});}
    function sendMsg(text){sock.sendMessage(msgId, { text: text});}
    
    //console.log(msgs)
    
    msgs {
      "conversation",
       
    }
    
    if(msg === ".ping"){
      reply('pong')
    }else if(msg.split(" ")[0] === ".spam"){
      const rng = msg.split(" ").length
      const txtmsg = msg.split(" ").filter( (x,y) => y > 0 && y < rng-1).join(" ")
      
      for(let i = 1; i <= msg.split(" ")[rng-1]; i++){
        sendMsg(txtmsg)
      }
    }
  })
}

connectToWhatsapp()