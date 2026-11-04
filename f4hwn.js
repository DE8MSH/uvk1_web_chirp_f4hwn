/* F4HWN UV-K1/UV-K5 V3 image/serial port. GPL-2.0-or-later.
 * Port based on f4hwn.chirp.v6.3.0 (2026-10-22), F4HWN/JOC2/EGZUMER/sq5bpf.
 * Never construct an EEPROM from defaults: preserve unknown bits from the source image.
 */
export const MEM_SIZE = 0xB190, BLOCK_SIZE = 0x80, PROG_SIZE = 0xA178;
export const STEPS = [2.5,5,6.25,10,12.5,25,8.33,0.01,0.05,0.1,0.25,0.5,1,1.25,9,15,20,30,50,100,125,200,250,500];
export const MODES = ['FM','NFM','AM','NAM','USB'];
export const POWERS = ['USER','<20mW','125mW','250mW','500mW','1W','2W','5W'];
export const COMPANDER = ['OFF','TX','RX','TX/RX'];
export const TONES = [67,69.3,71.9,74.4,77,79.7,82.5,85.4,88.5,91.5,94.8,97.4,100,103.5,107.2,110.9,114.8,118.8,123,127.3,131.8,136.5,141.3,146.2,151.4,156.7,159.8,162.2,165.5,167.9,171.3,173.8,177.3,179.9,183.5,186.2,189.9,192.8,196.6,199.5,203.5,206.5,210.7,218.1,225.7,229.1,233.6,241.8,250.3,254.1];
export const DCS = [23,25,26,31,32,36,43,47,51,53,54,65,71,72,73,74,114,115,116,122,125,131,132,134,143,145,152,155,156,162,165,172,174,205,212,223,225,226,243,244,245,246,251,252,255,261,263,265,266,271,274,306,311,315,325,331,332,343,346,351,356,364,365,371,411,412,413,423,431,432,445,446,452,454,455,462,464,465,466,503,506,516,523,526,532,546,565,606,612,624,627,631,632,654,662,664,703,712,723,731,732,734,743,754];
const BANDS = [[18,108],[108,136.9999],[137,173.9999],[174,349.9999],[350,399.9999],[400,469.9999],[470,1300]];
export function getBand(mhz) { return BANDS.findIndex(([low, high])=>mhz>=low && mhz<=high); }
function check(cond, text) { if(!cond) throw new Error(text); }
export function isEmpty(im,i,vfo=false) { const p=(vfo?0x9000:0)+i*16; const f=im.read32(p); return !f || f===0xFFFFFFFF; }
export class ImageFile {
 constructor(bytes) {
  check(bytes instanceof Uint8Array && bytes.length>=MEM_SIZE,`Ungültiges EEPROM: erwartet mindestens ${MEM_SIZE} Bytes`);
  this.data=new Uint8Array(Math.max(0xB200,bytes.length));this.data.fill(0xFF);this.data.set(bytes);
  this.original=this.data.slice();this.fileLength=bytes.length;
 }
 read32(o){return (this.data[o]|this.data[o+1]<<8|this.data[o+2]<<16|this.data[o+3]<<24)>>>0;}
 read16(o){return this.data[o]|this.data[o+1]<<8;}
 put32(o,n){n>>>=0;for(let k=0;k<4;k++)this.data[o+k]=(n>>>(8*k))&255;}
 put16(o,n){this.data[o]=n&255;this.data[o+1]=(n>>8)&255;}
 str(o,len){let out='';for(let i=0;i<len;i++){let c=this.data[o+i];if(c===0||c===255)break;out+=c>=32&&c<127?String.fromCharCode(c):' ';}return out.trimEnd();}
 setStr(o,len,value){check(/^[\x20-\x7E]*$/.test(value)&&value.length<=len,'Name: nur ASCII und passende Länge');for(let i=0;i<len;i++)this.data[o+i]=i<value.length?value.charCodeAt(i):0;}
 chan(i,vfo=false){check(i>=0&&i<(vfo?14:1024),'Kanal außerhalb des Bereichs');let o=(vfo?0x9000:0)+i*16,a=0x8000+2*(vfo?1024+Math.floor(i/2):i),name=vfo?`F${Math.floor(i/2)+1}${i%2?'B':'A'}`:this.str(0x4000+i*16,10);
  let f=this.read32(o),t=(code,flag)=>flag===1?(TONES[code]===undefined?'':`CTCSS ${TONES[code]}`):[2,3].includes(flag)?(DCS[code]===undefined?'':`DCS ${String(DCS[code]).padStart(3,'0')}${flag===3?'R':'N'}`):'';
  let b=this.data[o+12],m=(this.data[o+11]>>4)*2+((b>>1)&1);
  return {number:i+1,vfo,empty:!f||f===0xFFFFFFFF,name,rx:(!f||f===0xFFFFFFFF)?'':(f/1e5).toFixed(5),offset:(this.read32(o+4)/1e5).toFixed(5),duplex:(this.data[o+11]&15)===1?'+':(this.data[o+11]&15)===2?'-':'',mode:MODES[m]||'FM',power:(b>>2)&7,step:this.data[o+14]<STEPS.length?this.data[o+14]:0,txTone:t(this.data[o+9],this.data[o+10]>>4),rxTone:t(this.data[o+8],this.data[o+10]&15),scanlist:this.data[a+1]<=25?this.data[a+1]:0,compander:(this.data[a]>>3)&3,txLock:!!(b&0x40),busy:!!(b&0x20),reverse:!!(b&1),pttid:(this.data[o+13]>>1)&7};
 }
 putChan(i,c,vfo=false){check(i>=0&&i<(vfo?14:1024),'Kanalnummer ungültig');let o=(vfo?0x9000:0)+i*16,a=0x8000+2*(vfo?1024+Math.floor(i/2):i);
  if(c.empty){this.data.fill(255,o,o+16);if(!vfo){this.data.fill(32,0x4000+i*16,0x4000+(i+1)*16);this.data.fill(255,a,a+2);}return;}
  const rx=Number(c.rx),offset=Number(c.offset||0);
  check(Number.isFinite(rx)&&rx>=18&&rx<=1300&&getBand(rx)>=0,`Kanal ${i+1}: Frequenz außerhalb 18–1300 MHz`);
  check(Number.isFinite(offset)&&offset>=0&&offset<=1300,`Kanal ${i+1}: Offset ungültig`);
  check(['','+','-'].includes(c.duplex),'Ungültiger Shift');
  let tx=rx+(c.duplex==='+'?offset:c.duplex==='-'?-offset:0);
  check(getBand(tx)>=0,`Kanal ${i+1}: TX-Frequenz ungültig`);
  check(MODES.includes(c.mode),'Modus ungültig');
  check(Number.isInteger(+c.power)&&c.power>=0&&c.power<8,'Leistung ungültig');
  check(Number.isInteger(+c.step)&&c.step>=0&&c.step<STEPS.length,'Raster ungültig');
  check(Number.isInteger(+c.scanlist)&&c.scanlist>=0&&c.scanlist<=25,'Scanliste ungültig');
  check(Number.isInteger(+c.compander)&&c.compander>=0&&c.compander<=3,'Compander ungültig');
  if(!vfo)check(/^[\x20-\x7E]{0,10}$/.test(c.name),'Name darf maximal 10 ASCII-Zeichen enthalten');
  const rawFreq=rx*1e5,rawOff=offset*1e5;
  check(Math.abs(rawFreq-Math.round(rawFreq))<1e-5&&Math.abs(rawOff-Math.round(rawOff))<1e-5,'Frequenz/Offset nicht im 10-Hz-Raster');
  this.put32(o,Math.round(rawFreq));this.put32(o+4,Math.round(rawOff));
  let mode=MODES.indexOf(c.mode),mod=mode===4?2:Math.floor(mode/2),bw=mode===4?1:mode%2;
  this.data[o+11]=(mod<<4)|(c.duplex==='+'?1:c.duplex==='-'?2:0);
  let b=this.data[o+12]; b=(b&0x80)|(+!!c.txLock<<6)|(+!!c.busy<<5)|(+c.power<<2)|(bw<<1)|(+!!c.reverse);this.data[o+12]=b;
  let d=this.data[o+13];this.data[o+13]=(d&0xF1)|((Number(c.pttid||0)&7)<<1);
  this.data[o+14]=+c.step;
  const packTone=(str)=>{if(!str)return [0,0];if(str.startsWith('CTCSS ')){let n=TONES.indexOf(Number(str.slice(6)));check(n>=0,'CTCSS ungültig');return [1,n];}let m=/^DCS (\d{3})([NR])$/.exec(str);check(m,'Tonformat ungültig');let n=DCS.indexOf(Number(m[1]));check(n>=0,'DCS ungültig');return [m[2]==='R'?3:2,n];};
  let [tf,tc]=packTone(c.txTone),[rf,rc]=packTone(c.rxTone);this.data[o+9]=tc;this.data[o+8]=rc;this.data[o+10]=tf<<4|rf;
  this.data[a]=(this.data[a]&0xE0)|((+c.compander)<<3)|getBand(rx);
  if(!vfo){this.data[a+1]=+c.scanlist;this.setStr(0x4000+i*16,10,c.name);this.data.fill(0,0x4000+i*16+10,0x4000+i*16+16);}
 }
 scanName(i){check(i>=0&&i<24,'Scanliste');return this.str(0x880E+i*4,4);}
 setScanName(i,v){check(/^[\x20-\x7E]{0,3}$/.test(v),'Scanlistenname maximal 3 ASCII-Zeichen');if(v==='')this.data.fill(0xFF,0x880E+i*4,0x880E+i*4+4);else {const p=0x880E+i*4;for(let k=0;k<4;k++)this.data[p+k]=k<v.length?v.charCodeAt(k):0x20;}}
 getMixMask(){const p=0xA170,d=this.data;if(String.fromCharCode(...d.slice(p+3,p+6))!=='MIX'||d[p+6]!==1)return 0xFFFFFF;let m=d[p]|(d[p+1]<<8)|(d[p+2]<<16);return m||0xFFFFFF;}
 setMixMask(mask){check(Number.isInteger(mask)&&mask>0&&mask<=0xFFFFFF,'MIX-Maske ungültig');const p=0xA170;for(let i=0;i<3;i++)this.data[p+i]=(mask>>(i*8))&255;this.data.set([77,73,88,1],p+3);}
 getSetting(s){let b=this.data[s.offset];return (b>>s.shift)&((1<<s.bits)-1);}
 setSetting(s,val){let n=Number(val),lim=(1<<s.bits)-1;check(Number.isInteger(n)&&n>=0&&n<=lim,`Wert für ${s.label} ungültig`);let mask=lim<<s.shift;this.data[s.offset]=(this.data[s.offset]&~mask)|((n<<s.shift)&mask);}
 changedBytes(){let a=[];for(let i=0;i<PROG_SIZE;i++)if(this.data[i]!==this.original[i])a.push(i);return a;}
 export(){return this.data.slice(0,this.fileLength>=0xB200?this.fileLength:MEM_SIZE);}
}
// bit positions confirmed against CHIRP's bitwise parser; F4HWN scan speed storage is inverted.
export const SETTINGS=[
 {section:'F4HWN',label:'Sendeleistung (SetPwr)',offset:0xA15F,shift:4,bits:4,options:['<20mW','125mW','250mW','500mW','1W','2W','5W']},
 {section:'F4HWN',label:'PTT-Typ',offset:0xA15F,shift:0,bits:1,options:['CLASSIC','ONEPUSH']},
 {section:'F4HWN',label:'Scan-Geschwindigkeit (Bit invertiert)',offset:0xA15F,shift:1,bits:1,options:['FAST','NORMAL']},
 {section:'F4HWN',label:'Screensaver',offset:0xA15F,shift:2,bits:2,options:['OFF','LOGO','LOGO+','MATRIX']},
 {section:'F4HWN',label:'TOT-Anzeige',offset:0xA15E,shift:4,bits:4,options:['OFF','SOUND','VISUAL','ALL']},
 {section:'F4HWN',label:'EOT-Anzeige',offset:0xA15E,shift:0,bits:4,options:['OFF','SOUND','VISUAL','ALL']},
 {section:'F4HWN',label:'Kontrast',offset:0xA15D,shift:0,bits:4},
 {section:'F4HWN',label:'Display invertieren',offset:0xA15D,shift:4,bits:1,options:['OFF','ON']},
 {section:'F4HWN',label:'GUI-Stil',offset:0xA15D,shift:7,bits:1,options:['TINY','CLASSIC']},
 {section:'F4HWN',label:'S-Meter',offset:0xA15D,shift:6,bits:1,options:['TINY','CLASSIC']},
 {section:'F4HWN',label:'Tastensperre',offset:0xA15A,shift:0,bits:2,options:['KEYS','KEYS + ACTIONS','KEYS + PTT','ALLE']},
 {section:'F4HWN',label:'NFM-Filter',offset:0xA00E,shift:1,bits:2,options:['NARROW','NARROWER']},
 {section:'F4HWN',label:'RxA FM',offset:0xA000,shift:0,bits:4,options:['FLAT','CLEAN','MID','BOOST','MAX']},
 {section:'F4HWN',label:'RxA AM',offset:0xA000,shift:4,bits:4,options:['SHARP','STOCK','OPEN']},
 {section:'Allgemein',label:'Squelch (0-9)',offset:0xA001,shift:0,bits:8,min:0,max:9},
 {section:'Allgemein',label:'Mikrofonverstärkung',offset:0xA007,shift:0,bits:8,min:0,max:8},
 {section:'Allgemein',label:'Batteriesparen',offset:0xA00B,shift:0,bits:8,options:['OFF','1:1','1:2','1:3','1:4','1:5']},
 {section:'Allgemein',label:'Kanal-Anzeige',offset:0xA009,shift:0,bits:8,options:['FREQ','KANAL','NAME','NAME+FREQ']},
 {section:'Allgemein',label:'Tastenpiepton',offset:0xA0A8,shift:7,bits:1,options:['OFF','ON']},
 {section:'Allgemein',label:'Tastatursperre',offset:0xA004,shift:0,bits:1,options:['OFF','ON']},
 {section:'Allgemein',label:'FM-Radio Sprache',offset:0xA0B8,shift:0,bits:8},
 {section:'Allgemein',label:'Sende-VFO',offset:0xA0C3,shift:0,bits:8,options:['A','B']},
];
// Minimal WebAssembly acceleration: C CRC update / XOR byte functions; JS fallback remains testable.
const XOR_KEY=Uint8Array.from([22,108,20,230,46,145,13,64,33,53,213,64,19,3,233,128]);
let wasm=null;
export async function initWasm(){try{let r=await fetch(globalThis.__UVK1_WASM_URL||'./wasm/codec.wasm');if(!r.ok)throw Error('no wasm');let o=await WebAssembly.instantiate(await r.arrayBuffer(),{});wasm=o.instance.exports;return Boolean(wasm.crc16_update&&wasm.xor_byte);}catch{return false;}}
export function crc16(bytes){let crc=0;for(let x of bytes){if(wasm?.crc16_update)crc=wasm.crc16_update(crc,x);else{crc^=x<<8;for(let b=0;b<8;b++)crc=((crc<<1)^(crc&0x8000?0x1021:0))&0xFFFF;}}return crc;}
export function xor(bytes){return Uint8Array.from(bytes,(b,i)=>wasm?.xor_byte?wasm.xor_byte(b,i):b^XOR_KEY[i&15]);}
export function encode(payload){check(payload.length<=255,'Kommando zu lang');let crc=crc16(payload),o=new Uint8Array(payload.length+8);o.set([0xAB,0xCD,payload.length,0],0);o.set(xor(Uint8Array.from([...payload,crc&255,crc>>8])),4);o.set([0xDC,0xBA],o.length-2);return o;}
export class RadioSerial {
 constructor(log=()=>{}){this.log=log;this.port=null;this.reader=null;this.writer=null;this.buffer=new Uint8Array(0);this.firmware='';this.busy=false;}
 get connected(){return !!this.port;}
 async connect(){check('serial'in navigator,'Web Serial wird nicht unterstützt (Chrome/Chromium mit HTTPS verwenden)');check(!this.port,'Bereits verbunden');let port=await navigator.serial.requestPort();await port.open({baudRate:38400,dataBits:8,stopBits:1,parity:'none',flowControl:'none',bufferSize:2048});this.port=port;this.reader=port.readable.getReader();this.writer=port.writable.getWriter();this.buffer=new Uint8Array(0);this.log('Serieller Port verbunden (38400 Baud)');}
 async disconnect(){const r=this.reader,w=this.writer,p=this.port;this.port=null;this.reader=null;this.writer=null;this.buffer=new Uint8Array(0);try{if(r){try{await r.cancel();}catch{}r.releaseLock();}if(w){w.releaseLock();}if(p)await p.close();}catch(e){this.log(`Trennen: ${e.message}`);}this.log('Serieller Port getrennt');}
 async exact(n){let parts=[],have=0;while(have<n){if(this.buffer.length){let s=this.buffer.slice(0,n-have);parts.push(s);have+=s.length;this.buffer=this.buffer.slice(s.length);continue;}let pending=this.reader.read(),timer;let answer;try{answer=await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Zeitüberschreitung beim seriellen Lesen')),6000);})]);}catch(e){await this.disconnect();throw e;}finally{clearTimeout(timer);}if(answer.done||!answer.value?.length)throw Error('Serielle Verbindung unterbrochen');this.buffer=answer.value;}let ret=new Uint8Array(n),at=0;for(let v of parts){ret.set(v,at);at+=v.length;}return ret;}
 async exchange(payload){check(this.connected,'Kein Funkgerät verbunden');await this.writer.write(encode(payload));let h=await this.exact(4);check(h[0]===0xAB&&h[1]===0xCD&&h[3]===0,'Ungültiger Antwort-Header');let body=await this.exact(h[2]),tail=await this.exact(4);check(tail[2]===0xDC&&tail[3]===0xBA,'Ungültiger Antwort-Trailer');return xor(body);}
 async hello(){let r=await this.exchange(Uint8Array.of(0x14,0x05,0x04,0,0x6A,0x39,0x57,0x64));check(r.length>=4,'Keine Firmware-Antwort');check(!(r[0]===0x18&&r[1]===0x05),'Funkgerät im Firmware-Programmiermodus');this.firmware=Array.from(r.slice(4,28)).map(v=>v>=32&&v<127?String.fromCharCode(v):'\0').join('').split('\0')[0];this.log('Firmware: '+(this.firmware||'(nicht lesbar)'));return this.firmware;}
 async readImage(progress=()=>{}){check(!this.busy,'Bereits beschäftigt');this.busy=true;try{await this.hello();let bytes=new Uint8Array(0xB200);for(let addr=0;addr<bytes.length;addr+=BLOCK_SIZE){let p=Uint8Array.from([0x1B,0x05,0x08,0,addr&255,addr>>8,BLOCK_SIZE,0,0x6A,0x39,0x57,0x64]);let r=await this.exchange(p);check(r.length>=8+BLOCK_SIZE,`Ungültiger EEPROM-Block bei 0x${addr.toString(16)}`);bytes.set(r.slice(8,8+BLOCK_SIZE),addr);progress((addr+BLOCK_SIZE)/bytes.length,'EEPROM lesen');}return new ImageFile(bytes.slice(0,MEM_SIZE));}finally{this.busy=false;}}
 async writeImage(im,progress=()=>{}){check(!this.busy,'Bereits beschäftigt');check(im instanceof ImageFile,'Kein EEPROM geladen');this.busy=true;try{await this.hello();for(let addr=0;addr<PROG_SIZE;addr+=BLOCK_SIZE){let len=Math.min(BLOCK_SIZE,PROG_SIZE-addr),payload=new Uint8Array(12+len);payload.set([0x1D,0x05,len+8,0,addr&255,addr>>8,len,1,0x6A,0x39,0x57,0x64]);payload.set(im.data.slice(addr,addr+len),12);let ack=await this.exchange(payload);check(ack.length>=6&&ack[0]===0x1E&&ack[4]===(addr&255)&&ack[5]===(addr>>8),`EEPROM-Schreibbestätigung ungültig bei 0x${addr.toString(16)}`);progress((addr+len)/PROG_SIZE,'EEPROM schreiben');}await this.writer.write(encode(Uint8Array.of(0xDD,0x05,0,0)));this.log('Schreiben abgeschlossen, Gerät neu gestartet');}finally{this.busy=false;}}
}
