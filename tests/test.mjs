import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ImageFile, MEM_SIZE, crc16, xor, encode, TONES, DCS } from '../f4hwn.js';
let mem=new Uint8Array(MEM_SIZE).fill(0xff),im=new ImageFile(mem);
let c={empty:false,name:'DO7OO',rx:'145.50000',offset:'0.60000',duplex:'-',mode:'NFM',power:6,step:4,txTone:'CTCSS 67',rxTone:'DCS 023R',scanlist:3,compander:2,txLock:true,busy:true,reverse:false,pttid:2};
im.putChan(0,c);let got=im.chan(0);for(let key of Object.keys(c))assert.deepEqual(got[key],c[key],key);
assert.equal(im.data[0xA002],0xff); // opaque data unaffected
assert.equal(im.data[10],0x13); // TX CTCSS and RX reversed DCS flags
assert.equal(im.data[11],0x02); // FM/NFM modulation + minus shift
assert.equal(im.data[12],0xfa); // tx lock, busy lockout, power MID, narrow
assert.equal(im.data[0x8000]&31,(2<<3)|2); // compander RX, band 137..174
assert.equal(im.data[0x8001],3);
assert.equal(im.read32(0),14550000);assert.equal(im.read32(4),60000);
im.setScanName(0,'ABC');assert.equal(im.scanName(0),'ABC');
im.setMixMask(0x810001);assert.equal(im.getMixMask(),0x810001);
assert.equal(im.changedBytes().includes(0xA000),false);
assert.equal(crc16(new Uint8Array([0x14,0x05,0x04,0,0x6a,0x39,0x57,0x64])),0x9c98); // verified xmodem
let wire=encode(Uint8Array.of(0x14,0x05,0x04,0,0x6a,0x39,0x57,0x64));assert.equal(wire.length,16);assert.deepEqual([...wire.slice(0,4)],[0xab,0xcd,8,0]);assert.deepEqual([...wire.slice(-2)],[0xdc,0xba]);
let src=Uint8Array.of(0,1,2,3,4,5,6,7,8,9,10);assert.deepEqual([...xor(xor(src))],[...src]);
let wasm=await WebAssembly.instantiate(fs.readFileSync(new URL('../wasm/codec.wasm',import.meta.url)),{});let w=wasm.instance.exports;for(let n=0;n<256;n++)assert.equal(w.xor_byte(n,n),xor(Uint8Array.of(...new Array(n%16).fill(0),n)).at(-1));
for(let i=0;i<1000;i++){let a=i&255,b=(i*7)&65535;assert.equal(w.crc16_update(b,a),crc16Single(b,a));}
function crc16Single(crc,x){crc^=x<<8;for(let b=0;b<8;b++)crc=((crc<<1)^(crc&0x8000?0x1021:0))&65535;return crc;}
im.putChan(0,{empty:true});assert.equal(im.chan(0).empty,true);
console.log('PASS: F4HWN EEPROM, scan lists, CTCSS/DCS, protocol CRC/XOR and WASM');
