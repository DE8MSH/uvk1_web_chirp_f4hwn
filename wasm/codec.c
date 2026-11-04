/* GPL-2.0-or-later. Stateless F4HWN protocol helpers for Emscripten/WebAssembly. */
__attribute__((export_name("crc16_update"))) unsigned crc16_update(unsigned crc,unsigned byte){crc^=(byte&255u)<<8;for(int i=0;i<8;i++)crc=((crc<<1)^((crc&0x8000u)?0x1021u:0))&0xFFFFu;return crc;}
__attribute__((export_name("xor_byte"))) unsigned xor_byte(unsigned value,unsigned index){static const unsigned char key[16]={22,108,20,230,46,145,13,64,33,53,213,64,19,3,233,128};return (value^key[index&15u])&255u;}
