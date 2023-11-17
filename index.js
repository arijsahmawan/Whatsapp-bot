const {makeWASocket, MessageType, Mimetype, MessageOptions, useMultiFileAuthState} = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const qr = require('qrcode')
const rawData = require("./phone_number.json")
const useCode = process.argv.includes("--useCode")

async function connectToWhatsapp(){
  const auth = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    printQRInTerminal: !useCode,
    browser: ["Chrome (linux)", "", ""],
    auth: auth.state,
    logger: pino({level: "silent"}),
	generateHighQualityLinkPreview: true
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
    
    const msgType = Object.keys(msgs.message)[0];
	//console.log(msgType)
	console.log(msgs)
	
	const msgbody = msgType === 'conversation' ? msgs.message.conversation : msgType === 'extendedTextMessage' ? msgs.message.extendedTextMessage.text : msgType === 'imageMessage' ? msgs.message.imageMessage.caption : msgType === 'videoMessage' ? msgs.message.videoMessage.caption : null;
	
	
	switch(msgbody.split(' ')[0]){
		case '.menu' :
			reply('fitur masih dalam pengembangan')
			break;
		case '.ping':
			reply('pong')
			break;
		case '.spam' :
			const rng = msgbody.split(" ").length
			const txtmsg = msgbody.split(" ").filter( (x,y) => y > 0 && y < rng-1).join(" ")      
			for(let i = 1; i <= msgbody.split(" ")[rng-1]; i++){
				sendMsg(txtmsg)
			}
			break;
		case '.ytmp4' :
			break;
			
		case '.ytmp3' :
			break;
			
		case '.qr' :
			const _link = msgbody.split(' ').filter( (x,y) => y > 0 && y < msgbody.split(' ').length-1).join(' ')
			
			const fileName = msgbody.split(' ')[msgbody.split(' ').length-1]
			console.log(fileName)
			console.log(_link)
			const path = `generate/img/${fileName}.png`
			qr.toFile(path, _link, (err) => {
				if(err){
					console.error(err)
				}else{
					reply('Dalam proses...')
				}
			})	
			break;
		case '.link' :
			reply('https://touhou.fandom.com/wiki/Flandre_Scarlet')
			break;
		
		case '.img' :
			sock.sendMessage(msgId, {
				image: {url : './generate/img/shiina.png'},
				mimeType: 'image/png',
				caption: 'berasil mengirim gambar'}
			)
			break;
			
		case '.video' :
			sock.sendMessage(msgId, {
				video: {url : './generate/video/shiina.mp4'},
				mimeType: 'audio/mp4',
				caption: 'berasil mengirim video'}
			)
			break;
		default:
			return;
	}
  })
}

connectToWhatsapp()