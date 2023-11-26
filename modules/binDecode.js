/**
 * graphic.bin解码
 */

const {DecodeBuffer} = require('./base');

function decode(graphic) {
    if(graphic.startBlock !== 'RD'){
        throw new Error('错误的头文件');
    }

    let ver = graphic.version;
    let pad = graphic.pad;
    let w = graphic.imgWidth;
    let h = graphic.imgHeight;
    let size = graphic.imgSize;
    let palSize = graphic.palSize;
    let pOffset = graphic.pOffset;

    console.log({ver, pad, w, h, size, palSize, pOffset});

    let buf = graphic.imgData;
    let decodeBuf = new DecodeBuffer();

    // 当ver为偶数时, 即没有压缩, 直接返回数据
    if ((ver & 0x1) === 0) {
        console.log('not compress', ver, size, w, h, w * h);
        return { ver, pad, palSize, size: w * h, buffer: buf };
    }

    let keys = {};
    for (let i = 0; i < buf.length && i < size;) {
        let n1 = buf[i++];
        let chunk = null;

        let _key = n1.toString(16);
        if(_key.length === 1){
            _key = '0' + _key;
        }
        keys[_key] = true;

        // keys[n1.toString(16)] = true;

        if (n1 < 0x10) {
            // 0n	String	　	　	長度為n的字符串
            chunk = buf.subarray(i, i + n1);
            decodeBuf.write(chunk);
            i += chunk.length;
        } else if (n1 < 0x20) {
            // 1n	m	String	　	長度為n*0x100 + m的字符串
            let n2 = buf[i++];
            chunk = buf.subarray(i, i + ((n1 & 0xf) << 8) + n2);
            decodeBuf.write(chunk);
            i += chunk.length;
        } else if (n1 < 0x30) {
            let n2 = buf[i++];
            let n3 = buf[i++];
            chunk = buf.subarray(i, i + ((n1 & 0xf) << 16) + (n2 << 8) + n3);
            decodeBuf.write(chunk);
            i += chunk.length;
        } else if (n1 >= 0x80 && n1 < 0xB0) {
            if (n1 < 0x90) {
                chunk = Buffer.alloc((n1 & 0xf), buf[i++]);
                decodeBuf.write(chunk);
            } else if (n1 < 0xA0) {
                let n2 = buf[i++];
                chunk = Buffer.alloc(((n1 & 0xf) << 8) + buf[i++], n2);
                decodeBuf.write(chunk);
            } else if (n1 < 0xB0) {
                let n2 = buf[i++];
                let n3 = buf[i++];
                chunk = Buffer.alloc(((n1 & 0xf) << 16) + (n3 << 8) + buf[i++], n2);
                decodeBuf.write(chunk);
            }
        } else if (n1 >= 0xC0 && n1 < 0xF0) {
            if (n1 < 0xD0) {
                chunk = Buffer.alloc((n1 & 0xf), 0);
                decodeBuf.write(chunk);
            } else if (n1 < 0xE0) {
                let n2 = buf[i++];
                chunk = Buffer.alloc(((n1 & 0xf) << 8) + n2, 0);
                decodeBuf.write(chunk);
            } else if (n1 < 0xF0) {
                let n2 = buf[i++];
                let n3 = buf[i++];
                chunk = Buffer.alloc(((n1 & 0xf) << 16) + (n2 << 8) + n3, 0);
                decodeBuf.write(chunk);
            }
        } else {
            throw new Error('incorrect data');
        }
    }

    let allKey = Object.keys(keys);
    console.log(allKey);

    // console.log(decodeBuf.buffer);
    return { ver, pad, palSize, size: w * h, buffer: decodeBuf.buffer };
}


module.exports = {
    decode
};