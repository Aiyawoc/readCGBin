/**
 * 类
 * GraphicInfo 图片信息类
 * Graphic 图片数据类
 * AnimeInfo 动画信息类
 * Anime 动画数据类
 * Action 动作数据类
 * Frame 帧类
 * 其中, 一个Anime是由若干个Action组成, 每个Action中包含一个头和若干个Frame
 */

const fs = require('fs');

Buffer.prototype.insert = function (addr, hex) {
    let oriHex = this;
    let part0 = oriHex.slice(0, addr);
    let part1 = oriHex.slice(addr, oriHex.length);
    Buffer.concat([part0, hex, part1]);
}

class G {
    constructor(infoBuffer, dataBuffer) {
        this.graphicInfo = new GraphicInfo(infoBuffer);
        this.graphic = new Graphic(dataBuffer);
    }
}

class GraphicInfo {
    /**
     * 创建图片信息对象
     * @param {Buffer} buffer 十六进制图片信息数据
     * @param {Number} idx 该段数据在文件中的编号, 用于获取本条数据在文件中的地址selfAddr
     */
    constructor(buffer, idx = 0) {
        this.buffer = buffer;
        this.selfAddr = idx * 40;
        // 0-3字节[LONG]反转为编号
        // 4-7字节[DWORD]指明圖片在數據文件中的起始位置
        // 8-11字节[DWORD]圖片數據塊的大小
        // 12-15字节[LONG]偏移量X
        // 16-19字节[LONG]偏移量Y
        // 20-23字节[LONG]图片宽度
        // 24-27字节[LONG]图片高度
        // 28字节[BYTE]占地面积X
        // 29字节[BYTE]占地面积Y
        // 30字节[BYTE]用於地圖，0表示障礙物，1表示可以走上去
        // 31-35字节[BYTE]
        // 36-39字节[LONG]地图编号, 非地圖單位的此項均為0
    }

    /**
     * 获取图片编号
     */
    get imgNum() {
        return this.buffer.readIntLE(0, 4);
    }

    /**
     * 设置图片编号
     * @param {Number} num 图片编号 
     */
    set imgNum(num) {
        this.buffer.slice(0, 4).writeIntLE(num, 0, 4);
        return this.buffer.readIntLE(0, 4);
    }

    get addr() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set addr(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get imgSize() {
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    set imgSize(num) {
        this.buffer.slice(8, 12).writeIntLE(num, 0, 4);
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    get offsetX() {
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    set offsetX(num) {
        this.buffer.slice(12, 16).writeIntLE(num, 0, 4);
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    get offsetY() {
        return this.buffer.slice(16, 20).readIntLE(0, 4);
    }

    set offsetY(num) {
        this.buffer.slice(16, 20).writeIntLE(num, 0, 4);
        return this.buffer.slice(16, 20).readIntLE(0, 4);
    }

    get imgWidth() {
        return this.buffer.slice(20, 24).readIntLE(0, 4);
    }

    set imgWidth(num) {
        this.buffer.slice(20, 24).writeIntLE(num, 0, 4);
        return this.buffer.slice(20, 24).readIntLE(0, 4);
    }

    get imgHeight() {
        return this.buffer.slice(24, 28).readIntLE(0, 4);
    }

    set imgHeight(num) {
        this.buffer.slice(24, 28).writeIntLE(num, 0, 4);
        return this.buffer.slice(24, 28).readIntLE(0, 4);
    }

    get areaX() {
        return this.buffer.slice(28, 29).readIntLE(0, 1);
    }

    set areaX(num) {
        this.buffer.slice(28, 29).writeIntLE(num, 0, 1);
        return this.buffer.slice(28, 29).readIntLE(0, 1);
    }

    get areaY() {
        return this.buffer.slice(29, 30).readIntLE(0, 1);
    }

    set areaY(num) {
        this.buffer.slice(29, 30).writeIntLE(num, 0, 1);
        return this.buffer.slice(29, 30).readIntLE(0, 1);
    }

    get canMove() {
        return this.buffer.slice(30, 31).readIntLE(0, 1);
    }

    set canMove(num) {
        this.buffer.slice(30, 31).writeIntLE(num, 0, 1);
        return this.buffer.slice(30, 31).readIntLE(0, 1);
    }

    get unKnow() {
        return this.buffer.slice(31, 36);
    }

    set unKnow(num) {
        return this.buffer.slice(31, 36);
    }

    get mapId() {
        return this.buffer.slice(36, 40).readIntLE(0, 4);
    }

    set mapId(num) {
        this.buffer.slice(36, 40).writeIntLE(num, 0, 4);
        return this.buffer.slice(36, 40).readIntLE(0, 4);
    }
}

class Graphic {
    /**
     * 创建图片数据对象
     * @param {Buffer} buffer 十六进制图片数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        // 0-1字节固定为RD
        // 2字节为版本, 偶數表示未壓縮，按位圖存放；奇數則表示壓縮過
        // 3字节未知
        // 4-7字节图片宽度
        // 8-11字节图片高度
        // 12-15字节块大小
        // NOTE: 新版本16-19位为调色板, 20-N位为图片数据
        // NOTE: 旧版本 16-N位为图片数据
        this.decodeBuffer = null;
    }

    get startBlock() {
        return this.buffer.slice(0, 2).toString();
    }

    set startBlock(str) {
        // TODO: 待验证修改Graphic
        this.buffer.slice(0, 2).write(str, 0, 2);
        return this.buffer.slice(0, 2).toString();
    }

    get version() {
        return this.buffer.slice(2, 3).readIntLE(0, 1);
    }

    set version(num) {
        this.buffer.slice(2, 3).writeIntLE(num, 0, 1);
        return this.buffer.slice(2, 3).readIntLE(0, 1);
    }

    get pad() {
        return this.buffer.slice(3, 4).readIntLE(0, 1);
    }

    set pad(num) {
        this.buffer.slice(3, 4).writeIntLE(num, 0, 1);
        return this.buffer.slice(3, 4).readIntLE(0, 1);
    }

    get imgWidth() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set imgWidth(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get imgHeight() {
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    set imgHeight(num) {
        this.buffer.slice(8, 12).writeIntLE(num, 0, 4);
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    get imgSize() {
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    set imgSize(num) {
        this.buffer.slice(12, 16).writeIntLE(num, 0, 4);
        return this.buffer.slice(12, 16).readIntLE(0, 4);
    }

    insertpalSize(num = 768) {
        if (this.version & 2) {
            return this.buffer.slice(16, 20).readIntLE(0, 4);
        }

        let part0 = this.buffer.slice(0, 16);
        let paletteHex = Buffer.alloc(4);
        paletteHex.writeIntLE(num, 0, 4);
        let part1 = this.buffer.slice(16, this.buffer.length);
        this.buffer = Buffer.concat([part0, paletteHex, part1]);
        return this.buffer.slice(16, 20).readIntLE(0, 4);
    }

    get palSize() {
        if (this.version & 2) {
            return this.buffer.slice(16, 20).readIntLE(0, 4);
        }
        return 0;
    }

    set palSize(num) {
        if (this.version & 2) {
            this.buffer.slice(16, 20).writeIntLE(num, 0, 4);
            return this.buffer.slice(16, 20).readIntLE(0, 4);
        }
        return 0;
    }

    get cgp() {
        // 获取图片自带调色板, 调色板是解压后的数据
        if (this.version & 2) {
            // let decodeBuffer = this.decode();
            // let cgpHex = decodeBuffer.slice(decodeBuffer.length-this.palSize, decodeBuffer.length);
            let cgpHex = this.buffer.slice(this.buffer.length - this.palSize, this.buffer.length);
            console.log('cgpHex: ', cgpHex.length, cgpHex.length/3);
            let cgp = new Cgp(cgpHex);
            return cgp;
        }
        return null;
    }

    set cgp(cgp) {
        // TODO: 设置图片自带调色板

    }

    get pOffset() {
        if (this.version & 2) {
            return 4;
        }
        return 0;
    }

    get imgData() {
        if (this.version & 2) {
            // 当有调色板数据时, 截取从20位开始, 到buffer.lenght-调色板大小
            return this.buffer.slice(20, this.buffer.length - this.palSize);
        }
        // 当没有调色板数据时, 截取从16位开始, 到buffer.lenght
        return this.buffer.slice(16, this.buffer.length);
    }

    set imgData(hex) {
        // TODO:替换Graphic的bmp数据
        if (this.version & 2) {
            return this.buffer.slice(20, this.buffer.length - this.palSize);
        }
        return this.buffer.slice(16, this.buffer.length);
    }

    decode() {
        let graphic = this;
        if (graphic.startBlock !== 'RD') {
            throw new Error('错误的头文件');
        }

        let ver = graphic.version;
        let pad = graphic.pad;
        let w = graphic.imgWidth;
        let h = graphic.imgHeight;
        let palSize = graphic.palSize;
        let buf = graphic.imgData;
        let size = graphic.imgSize;
        let pOffset = graphic.pOffset;

        let decodeBuf = new DecodeBuffer();

        // 当ver为偶数时, 即没有压缩, 直接返回数据
        if ((ver & 0x1) === 0) {
            console.log('not compress', ver, size, w, h, w * h);
            return graphic.imgData;
        }

        let keys = {};
        for (let i = 0; i < buf.length && i < size;) {
            let n1 = buf[i++];
            let chunk = null;

            let _key = n1.toString(16);
            if (_key.length === 1) {
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

        return decodeBuf.buffer;
    }

    /**
     * 生成bmp图片
     * 参考链接: https://blog.csdn.net/u013066730/article/details/82625158
     * @param {String} filePath 生成图片的目录+文件名
     * @param {Array} alphaColor 设置背景色BGRA[0, 0, 0, 0]
     * @param {Cgp} cgp 调色板, 传入cgp>图片自带cgp>默认官方cgp
     * @param {Function} callback 回调函数
     */
    createBMP(filePath, alphaColor, cgp, callback) {
        // 调用encode将this.buffer解密
        let imgData = this.decode();

        // 调色板数据(BGRA), 256*4位=1024位, 传入cgp>图片自带cgp>默认cgp
        cgp = cgp || this.cgp || CGPMAP.get('palet_00.cgp');
        let bgraBuffer = cgp.bgraBuffer;
        if(alphaColor){
            // 如果传入了alphaColor, 则将调色板中第一组色值改为alphaColor的色值
            for(let i=0;i<alphaColor.length;i++){
                bgraBuffer.writeUInt8(alphaColor[i], i);
            }
        }

        console.log(bgraBuffer);

        // 获得像素数据, 生成bmp文件
        let imgWidth = this.imgWidth;
        let imgHeight = this.imgHeight;
        let fileSize = 14 + 40 + bgraBuffer.length + imgData.length;

        let offset = 0;

        // bmp文件头 14位
        let bmpHead = Buffer.alloc(14);
        // 0-1字节固定为BM
        bmpHead.write('BM', 0, 2); offset += 2;
        // 2-5字节为文件大小, 文件头14+信息头40+调色盘1024+位图数据
        bmpHead.writeIntLE(fileSize, offset, 4); offset += 4;
        // 6-7字节保留, 为0
        bmpHead.writeIntLE(0, offset, 2); offset += 2;
        // 8-9字节保留, 为0
        bmpHead.writeIntLE(0, offset, 2); offset += 2;
        // 10-13字节为数据偏移量, 从文件头开始到实际图像数据的偏移量, 为bmp头14位+位图信息头40位+调色盘位
        bmpHead.writeIntLE(14 + 40 + bgraBuffer.length, offset, 4); offset += 4;

        // 位图信息头 40位
        let imgHead = Buffer.alloc(40); offset = 0;
        // 0-3字节为位图信息头大小, 固定为40
        imgHead.writeIntLE(40, offset, 4); offset += 4;
        // 4-7字节为图像宽度
        imgHead.writeIntLE(imgWidth, offset, 4); offset += 4;
        // 8-11字节为图像高度
        imgHead.writeIntLE(imgHeight, offset, 4); offset += 4;
        // 12-13字节为位图平面数, 固定为1
        imgHead.writeIntLE(1, offset, 2); offset += 2;
        // 14-15字节为每个像素的位数, 其值为1, 4, 8, 16, 24, 32, cg采用8位
        imgHead.writeIntLE(8, offset, 2); offset += 2;
        // 16-19位图像压缩方式, 0:BI_RGB不压缩(最常用), 1:BI_RLE8 8比特游程编码,只用于8位位图, 2:BI_RLE4 4比特游程编码, 只用于4位位图, 3:BI_bitfields 比特域, 用于16/32位位图, 4: JPEG, 5为PNG
        imgHead.writeIntLE(0, offset, 4); offset += 4;
        // 20-23位图数据大小
        // imgHead.writeIntLE(0, offset, 4); offset += 4;
        // imgHead.writeIntLE(fileSize, offset, 4); offset += 4;
        imgHead.writeIntLE(imgData.length, offset, 4); offset += 4;
        // 24-27水平分辨率, 像素/米
        imgHead.writeIntLE(0, offset, 4); offset += 4;
        // 28-31垂直分辨率, 像素/米
        imgHead.writeIntLE(0, offset, 4); offset += 4;
        // 32-35位图实际使用的调色板中的颜色数, 设置为0时表示使用全部调色板项, cg采用256色
        imgHead.writeIntLE(256, offset, 4); offset += 4;
        // 36-39位图显示过程中重要的颜色数, 设置为0时表示所有颜色都重要
        imgHead.writeIntLE(0, offset, 4); offset += 4;

        // 位图数据, 每个像素1个字节, 以该字节为索引, 在调色板中取颜色
        let bmpData = Buffer.concat([bmpHead, imgHead, bgraBuffer, imgData]);

        // 回调图片地址
        fs.writeFileSync(filePath, bmpData);
        callback();
    }
}

class A {
    constructor(infoBuffer, dataBuffer) {
        this.animeInfo = new AnimeInfo(infoBuffer);
        this.anime = new Anime(dataBuffer);
    }
}

class AnimeInfo {
    /**
     * 创建动画信息对象
     * @param {Buffer} buffer 十六进制动画信息数据
     * @param {Number} idx 该段数据在文件中的编号, 用于获取本条数据在文件中的地址selfAddr
     */
    constructor(buffer, idx) {
        this.buffer = buffer;
        this.selfAddr = idx * 12;
        // 0-3字节[LONG]为动画编号
        // 4-7字节[DWORD]动画数据地址
        // 8-9字节[DWORD]动画数量
        // 10-11字节[LONG]未知
    }

    get animeId() {
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }

    set animeId(num) {
        this.buffer.slice(0, 4).writeIntLE(num, 0, 4);
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }

    get addr() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set addr(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get animeCount() {
        return this.buffer.slice(8, 10).readIntLE(0, 2);
    }

    set animeCount(num) {
        this.buffer.slice(8, 10).writeIntLE(num, 0, 2);
        return this.buffer.slice(8, 10).readIntLE(0, 2);
    }

    get other() {
        return this.buffer.slice(10, 12).readIntLE(0, 2);
    }

    set other(num) {
        this.buffer.slice(10, 12).writeIntLE(num, 0, 2);
        return this.buffer.slice(10, 12).readIntLE(0, 2);
    }
}

class Anime {
    /**
     * 创建动画数据对象
     * @param {Buffer} buffer 十六进制动画数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        this.actions = [];
        this.imgList = [];
        this.getActions();
    }

    getActions() {
        let addr = 0;
        let endAddr = this.buffer.length;
        while (addr < endAddr) {
            let headHex = this.buffer.slice(addr, addr + 20);
            let frameCount = headHex.slice(8, 12).readIntLE(0, 4);
            let actionEndAddr = addr + 20 + (frameCount * 10);
            let actionHex = this.buffer.slice(addr, actionEndAddr);
            let action = new Action(actionHex);
            this.actions.push(action);
            addr = actionEndAddr;
        }
    }

    get imgList() {
        let imgArr = {};
        for (let i = 0; i < this.actions.length; i++) {
            let _action = this.actions[i];
            for (let j = 0; j < _action.frames.length; j++) {
                let _frame = _action.frames[j];
                imgArr[_frame.imgNum] = true;
            }
        }

        imgArr = Object.keys(imgArr);

        return imgArr;
    }

    set imgList(num) {
        return
    }
}

class Action {
    /**
     * 创建动作类
     * @param {Buffer} buffer 十六进制动作数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        this.frames = [];
        this.getFrames();
    }

    get direction() {
        return this.buffer.slice(0, 2).readIntLE(0, 2);
    }

    set direction(num) {
        this.buffer.slice(0, 2).writeIntLE(num, 0, 2);
        return this.buffer.slice(0, 2).readIntLE(0, 2);
    }

    get actionNum() {
        return this.buffer.slice(2, 4).readIntLE(0, 2);
    }

    set actionNum(num) {
        this.buffer.slice(2, 4).writeIntLE(num, 0, 2);
        return this.buffer.slice(2, 4).readIntLE(0, 2);
    }

    get aniTime() {
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    set aniTime(num) {
        this.buffer.slice(4, 8).writeIntLE(num, 0, 4);
        return this.buffer.slice(4, 8).readIntLE(0, 4);
    }

    get frameCount() {
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    set frameCount(num) {
        this.buffer.slice(8, 12).writeIntLE(num, 0, 4);
        return this.buffer.slice(8, 12).readIntLE(0, 4);
    }

    getFrames() {
        let _addr = 20;
        for (let i = 0; i < this.frameCount; i++) {
            let frameHex = this.buffer.slice(i * 10 + _addr, i * 10 + _addr + 10);
            let frame = new Frame(frameHex);
            this.frames.push(frame);
        }
    }

    createGIF(callback) {
        // TODO: 将本动作生成GIF

    }
}

class Frame {
    /**
     * 创建帧对象
     * @param {Buffer} buffer 十六进制帧数据
     */
    constructor(buffer) {
        this.buffer = buffer;
        // this.img = null; //是否直接获取图片数据?
    }

    get imgNum() {
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }

    set imgNum(num) {
        this.buffer.slice(0, 4).writeIntLE(num, 0, 4);
        return this.buffer.slice(0, 4).readIntLE(0, 4);
    }
}

class DecodeBuffer {
    constructor(width, height) {
        // this.buffer = Buffer.alloc(width * height);
        this.buffer = Buffer.alloc(0);
    }

    write(hex) {
        this.buffer = Buffer.concat([this.buffer, hex]);
    }

    get length() {
        return this.buffer.length;
    }
}

// 游戏指定的调色板0-15 BGRA
const g_c0_15 = [
    [0x00, 0x00, 0x00],
    [0x80, 0x00, 0x00],
    [0x00, 0x80, 0x00],
    [0x80, 0x80, 0x00],
    [0x00, 0x00, 0x80],
    [0x80, 0x00, 0x80],
    [0x00, 0x80, 0x80],
    [0xc0, 0xc0, 0xc0],
    [0xc0, 0xdc, 0xc0],
    [0xa6, 0xca, 0xf0],
    [0xde, 0x00, 0x00],
    [0xff, 0x5f, 0x00],
    [0xff, 0xff, 0xa0],
    [0x00, 0x5f, 0xd2],
    [0x50, 0xd2, 0xff],
    [0x28, 0xe1, 0x28]
];

// 游戏指定的调色板240-255 BGRA
const g_c240_255 = [
    [0xf5, 0xc3, 0x96],
    [0x1e, 0xa0, 0x5f],
    [0xc3, 0x7d, 0x46],
    [0x9b, 0x55, 0x1e],
    [0x46, 0x41, 0x37],
    [0x28, 0x23, 0x1e],
    [0xff, 0xfb, 0xf0],
    [0x3a, 0x6e, 0x5a],
    [0x80, 0x80, 0x80],
    [0xff, 0x00, 0x00],
    [0x00, 0xff, 0x00],
    [0xff, 0xff, 0x00],
    [0x00, 0x00, 0xff],
    [0xff, 0x80, 0xff],
    [0x00, 0xff, 0xff],
    [0xff, 0xff, 0xff]
];

class Cgp {
    /**
     * 调色板类
     * @param {Buffer} buffer 调色板数据buffer
     * @param {Boolean} isDefault 是否为官方调色板, 默认否
     */
    constructor(buffer, isDefault = false) {
        this.buffer = buffer;
        this.isDefault = isDefault;
    }

    get bgr(){
        let colorList = [];
        let len = this.buffer.length / 3;
        for (let i = 0; i < len; i++) {
            let B = this.buffer[i * 3];
            let G = this.buffer[i * 3 + 1];
            let R = this.buffer[i * 3 + 2];

            colorList.push([B, G, R]);
        }

        if (this.isDefault) {
            // 官方调色板, 需增加前16色并从240开始覆盖后16色
            colorList = [...g_c0_15, ...colorList];
            colorList.length = 240;
            for (let i = 0; i < g_c240_255.length; i++) {
                colorList.push(g_c240_255[i]);
            }
        }

        return colorList;
    }

    get bgrBuffer(){
        let colorList = this.bgr;
        let buffer = Buffer.alloc(0);
        for(let i=0;i<colorList.length;i++){
            let BGR = Buffer.from(colorList[i]);
            buffer = Buffer.concat([buffer, BGR]);
        }
        return buffer;
    }

    get bgra(){
        let colorList = [];
        let alpha = 0;

        if(this.isDefault){
            for(let i=0;i<g_c0_15.length;i++){
                colorList.push([...g_c0_15[i], alpha]);
            }
        }

        let len = this.buffer.length / 3;
        for (let i = 0; i < len; i++) {
            let B = this.buffer[i * 3];
            let G = this.buffer[i * 3 + 1];
            let R = this.buffer[i * 3 + 2];
            // RGB RBG GBR GRB BRG BGR
            colorList.push([B, G, R, alpha]);
        }

        if (this.isDefault) {
            // 官方调色板, 从240开始覆盖后16色
            colorList.length = 240;
            for (let i = 0; i < g_c240_255.length; i++) {
                this.colorList.push([...g_c240_255[i], alpha]);
            }
        }

        return colorList;
    }

    get bgraBuffer(){
        let colorList = this.bgra;
        let buffer = Buffer.alloc(0);
        for(let i=0;i<colorList.length;i++){
            let BGRA = Buffer.from(colorList[i]);
            buffer = Buffer.concat([buffer, BGRA]);
        }
        return buffer;
    }
}

const CGPMAP = new Map();
cgpInit();
function cgpInit() {
    let cgpList = fs.readdirSync('./pal');
    // console.log(cgpList);
    for (let i = 0; i < cgpList.length; i++) {
        CGPMAP.set(cgpList[i], new Cgp(fs.readFileSync(`./pal/${cgpList[i]}`), true));
    }

    CGPMAP.length = cgpList.length;
}

module.exports = { G, GraphicInfo, Graphic, A, AnimeInfo, Anime, Action, Frame, DecodeBuffer, Cgp }