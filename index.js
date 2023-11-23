const {makeWASocket, MessageType, Mimetype, MessageOptions, useMultiFileAuthState} = require('@whiskeysockets/baileys')
const pino = require('pino')
const fsp = require('fs/promises')
const fs = require('fs')
const qr = require('qrcode')
const rawData = require("./data.json")
const useCode = process.argv.includes("--useCode")
const ytdl = require('ytdl-core')

async function removeFolder(){
	const folder = './generate'
	if(fsp.access(folder)){
		console.log('=====> Menghapus folder')
		await fs.rmSync(folder, {recursive: true, force: true})
	}else{
		console.log('=====> Folder sudah dihapus')
	}
}

async function checkFolder(){
	const folder = './generate'
	const subFolder = ['image', 'audio', 'video']
	try{
		await fsp.access(folder)
		console.log('=====> folder sudah ada')
	}catch(err){
		if(err.code === 'ENOENT'){
			await fsp.mkdir(folder)
			for(const path of subFolder){
				const folderPath = `${folder}/${path}`
				await fsp.mkdir(folderPath)
			}
			console.log('=====> folder dibuatkan')
		}else{
			console.error(err)
		}
	}
}

removeFolder()
checkFolder()

async function connectToWhatsapp(){
  const auth = await useMultiFileAuthState("auth")
  const sock = makeWASocket({
    printQRInTerminal: !useCode,
    browser: ["Chrome (Linux)", "", ""],
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
    const msgs = messages[0];
    const msgId = msgs.key.remoteJid;
    const msg = msgs.message.conversation;
    //console.log(`${msgId.split("@")[0]} : ${msg}`);
    function reply(text){sock.sendMessage(msgId, { text: text }, {quoted: msgs});};
    function sendMsg(text){sock.sendMessage(msgId, { text: text});};
    
    const msgType = Object.keys(msgs.message)[0];
	//console.log(msgType)
	console.log(msgs);
	
	function sendingMedia(id, path, type, cp){
		if(type === 'image'){
			sock.sendMessage(id, {
				image: {url : path},
				mimeType: 'image/png',
				caption: cp}
			)
		}else if(type === 'audio'){
			sock.sendMessage(id, {
				audio: {url : path},
				mimeType: 'audio/mp3',
				caption: cp}, 
				{
					quoted: msgs
				}
			)
		}else if(type === 'video'){
			sock.sendMessage(id, {
				video: fs.readFileSync(path),
				mimeType: 'video/mp4',
				caption: cp}, 
				{
					quoted: msgs
				}
			)
		}	
	}
	
	const msgbody = msgType === 'conversation' ? msgs.message.conversation : msgType === 'extendedTextMessage' ? msgs.message.extendedTextMessage.text : msgType === 'imageMessage' ? msgs.message.imageMessage.caption : msgType === 'videoMessage' ? msgs.message.videoMessage.caption : '';

	

	//changeGruop()

	if(msgId.split('@')[1] === 'g.us'){
		const participant = msgs.key.participant;		
	}
	
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
		case '.qr' :
			const _link = msgbody.split(' ').filter( (x,y) => y > 0 && y < msgbody.split(' ').length).join(' ')
			function filename(){
				var pw = ''
				for(let i = 0; i < 8; i++){
					pw += rawData.alfabet.charAt(Math.floor( Math.random() * rawData.alfabet.length))
					return pw
				}	
			}

			const fileName = filename()
			console.log(fileName)
			console.log(_link)
			const path = `generate/image/${fileName}.png`
			qr.toFile(path, _link, (err) => {
				if(err){
					console.error(err)
				}else{
					reply('Dalam proses...')
			    sendingMedia(msgId, path, 'image', 'berhasil membuat qrcode')
				}
			})	
			break;

		case '.ytvideo' :
			reply('Dalam proses...')
			const urlVideo = msgbody.split(' ')[1];
			ytdl.getInfo(urlVideo)
				.then(info => {
					const path = './generate/video/'+info.videoDetails.videoId+'.mp4'
					ytdl(urlVideo, {quality: 'highest'})
						.pipe(fs.createWriteStream(path))
						.on('finish', () => {
							sendingMedia(msgId, path, 'video', 'berhasil mengirim video')
						})
				})
				.catch(error => console.error(error))
			break;

		case '.ytaudio' :
			reply('Dalam proses...')
			const urlAudio = msgbody.split(' ')[1];
			ytdl.getInfo(urlAudio)
				.then(info => {
					const path = './generate/audio/'+info.videoDetails.videoId+'.mp3'
					ytdl(urlAudio, {quality: 'highestaudio'})
						.pipe(fs.createWriteStream(path))
						.on('finish', () => {
							console.log('unduhan selesai');
							sendingMedia(msgId, path, 'audio', 'berhasil mengirim audio')
						})
				})
				.catch(error => console.error(error))
			break;
		
		case '.pw' :
			function pwGenerator(length){
				var charset = rawData.charset;
				var len = charset.length, pw = "";
				for(let i = 0; i < length; i++){
					pw += charset.charAt(Math.floor( Math.random() * len))
				}
				return pw;
			}
			if(msgbody === '.pw'){
				const password = pwGenerator(8)
				reply(password)
				console.log(password)
			}else{
				const password = pwGenerator(msgbody.split(' ')[1]);
				console.log(password)
				reply(password)
			}
			break;
		case '.ttb' :
			
			break;
		
		case '.everyone' :
			async function tag(){
				const participants = await sock.groupMetadata(msgId);
	            // Membuat array mention untuk setiap anggota grup
            	const mentions = participants.participants.map(participant => ({
                	"id": participant.jid,
                	"notify": participant.notify || participant.jid,
	                "type": "participant"
            	}));
				console.log(participants)
				console.log(mentions)
	            // Membuat pesan dengan mention untuk semua anggota
            	const mentionedMessage = {
                	text: 'Halo semua!',
                	mentions
	            };
            	// Mengirim pesan dengan mention ke grup
            	await sock.sendMessage(msgId, mentionedMessage);
			}
			tag()
			break;
		case ".tag" :
		  const mentionMsg = sock.sendMessage( id, {
		    text: "@"+msgId.split("@")[0],
		    mentions: [msgid]
		  })
		  break;
		default:
			return;
	}
  })
}

connectToWhatsapp()
