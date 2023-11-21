/**
 * 
 */


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

    let buf = graphic.imgData;
    let decodeBuf = Buffer.alloc(w*h);

    // 当ver为偶数时, 即没有压缩, 直接返回数据
    if ((ver & 0x1) === 0) {
        console.log('not compress', ver, size, w, h, w * h);
        return { ver, pad, palSize, size: w * h, buffer: buf };
    }

    for (let i = 0; i < buf.length && i < size;) {
        let n1 = buf[i++];
        if (n1 < 0x10) {
            let chunk = buf.subarray(i, i + n1);
            stream.write(chunk);
            i += chunk.length;
        } else if (n1 < 0x20) {
            let n2 = buf[i++];
            let chunk = buf.subarray(i, i + ((n1 & 0xf) << 8) + n2);
            stream.write(chunk);
            i += chunk.length;
        } else if (n1 < 0x30) {
            let n2 = buf[i++];
            let n3 = buf[i++];
            let chunk = buf.subarray(i, i + ((n1 & 0xf) << 16) + (n2 << 8) + n3);
            stream.write(chunk);
            i += chunk.length;
        } else if (n1 >= 0x80 && n1 < 0xB0) {
            if (n1 < 0x90) {
                stream.write(Buffer.alloc((n1 & 0xf), buf[i++]));
            } else if (n1 < 0xA0) {
                let n2 = buf[i++];
                stream.write(Buffer.alloc(((n1 & 0xf) << 8) + buf[i++], n2));
            } else if (n1 < 0xB0) {
                let n2 = buf[i++];
                let n3 = buf[i++];
                stream.write(Buffer.alloc(((n1 & 0xf) << 16) + (n3 << 8) + buf[i++], n2));
            }
        } else if (n1 >= 0xC0 && n1 < 0xF0) {
            if (n1 < 0xD0) {
                stream.write(Buffer.alloc((n1 & 0xf), 0));
            } else if (n1 < 0xE0) {
                let n2 = buf[i++];
                stream.write(Buffer.alloc(((n1 & 0xf) << 8) + n2, 0));
            } else if (n1 < 0xF0) {
                let n2 = buf[i++];
                let n3 = buf[i++];
                stream.write(Buffer.alloc(((n1 & 0xf) << 16) + (n2 << 8) + n3, 0));
            }
        } else {
            throw new Error('incorrect data');
        }
    }
    return { ver, pad, palSize, size: w * h, buffer: stream.toBuffer() };
}