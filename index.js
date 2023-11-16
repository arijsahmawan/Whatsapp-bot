const {makeWASocket, MessageType, Mimetype, MessageOptions, useMultiFileAuthState} = require('@whiskeysockets/baileys')
const pino = require('pino')

async function connectToWhatsapp(){
  const auth = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    printQRInTerminal: true,
    browser: ["idun", "Firefox", "1.0.0"],
    auth: auth.state,
    logger: pino({level: "silent"})
  })
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
    console.log(`${msgId.split("@")[0]} : ${msg}`)
    function reply(text){
      sock.sendMessage(msgId, { text: text }, {quoted: msgs});
    }
    
    console.log(msgs)
    
    if(msg === ".ping"){
      reply('pong')
    }
  })
}

connectToWhatsapp()