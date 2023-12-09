// png-8类

/* NOTE: png8格式图片数据结构
* png数据为大头模式, 读取时需要使用readIntBE, 写入时需要使用writeIntBE
* 除png头外, 其它数据块均由4部分组成, 块数据长度(4字节), 块类型标记(4字节), 块数据, CRC校验码(4字节)
* 
* 0-7位为固定png头 89 50 4e 47 0d 0a 1a 0a (0x89 + 'PNG' + 0x0d 0x0a 0x1a 0x0a)
* 
* IHDR块数据
* 0-3位为IHDR块数据长度, 固定为13(从标记位到块尾的长度)
* 4-7位为块类型标记, 固定为49 48 44 52(IHDR)
* 8-11位为图片宽度
* 12-15位为图片高度
* 16位为位深度, 8   索引彩色:1|2|4|8; 灰度:1|2|4|8|16; 真彩色:8|16
* 17位为颜色类型, 3 0:灰度, 2:真彩色, 3:索引色, 4:带α通道的灰度图像, 6:带α通道的真彩色
* 18位为压缩方法? 0
* 19位为滤波器方法? 0
* 20位为隔行扫描? 0
* 21-24位为CRC校验码, 由数据块名+数据块内容进行crc计算获得
* 
* PLTE块数据(调色板数据块)
* 0-3位为PLTE块数据长度, 调色板颜色数*3, 最小为1*3, 最大为256*3
* 4-7位为块类型标记, 固定为50 4c 54 45(PLTE)
* 8-N位为调色板数据, RGB结构, PLTE可以包含1~256个调色板信息，每一个调色板信息由3个字节组成，因此调色板数据块所包含的最大字节数为768，调色板的长度应该是3的倍数，否则，这将是一个非法的调色板。调色板的颜色数不能超过图像色深中规定的颜色数，否则会非法。
* N-N+3位为CRC校验码, 由数据块名+数据块内容进行crc计算获得
* 
* TRNS块数据(图像透明数据块, 图像颜色模式为0|2|3必填, 标记每个颜色的透明度)
* 0-3位为TRNS块数据长度, 值为调色板的颜色数
* 4-7位为块类型标记, 固定为74 52 4e 53(TRNS)
* 8-N位为透明度, 值为0x00~0xff, 与调色板颜色数相同, 代表调色板中某颜色的透明度
* N-N+3位为CRC校验码, 由数据块名+数据块内容进行crc计算获得
* 
* PHYS块数据(物理像素尺寸块)    测试是否可以删除?
* 0-3位为PHYS块长度, 固定为9
* 4-7位为块类型标记, 固定为70 48 59 73(PHYS)
* 8-11位为像素每单位X轴的长度, 4字节无符号整数
* 12-15位为像素每单位Y轴的长度, 4字节无符号整数
* 16位为单位, 1字节 0:米, 1:未知
* 当单位说明符为 0 时，pHYs块仅定义像素纵横比；像素的实际大小仍未指定。如果不存在pHYs块，则假定像素为正方形，并且未指定每个像素的物理尺寸;
* N-N+3位为CRC校验码, 由数据块名+数据块内容进行crc计算获得
* 
* IDAT块数据(图像数据块)
* 0-3位为IDAT块长度, 图像数据块的长度, 从标记位到块尾的长度, 
* 4-7位为块类型标记, 固定为49 44 41 54(IDAT)
* 8-N位为图像数据, 从标记位到块尾的数据,LZ77压缩算法压缩的数据
* N-N+3位为CRC校验码, 由数据块名+数据块内容进行crc计算获得
*
* 行过滤器   索引值
* 0x00       0x00 0x01 0x0F 0xF0 ...
* 0x00       0x00 0x01 0x0F 0xF0 ...
* 0x00       0x00 0x01 0x0F 0xF0 ...
* 0x00       0x00 0x01 0x0F 0xF0 ...
* 目前已知行过滤器为0时, 该行每个像素占用1字节为颜色索引值, 其它模式未知
* 
* IEND块数据
* 0-3位为IEND块长度, 固定为0
* 4-7位为块类型标记, 固定为49 45 4e 44(IEND)
* 8-11位为CRC校验码, 由数据块名+数据块内容进行crc计算获得, 固定为ae 42 60 82?
*/

const fs = require('fs');
// const Path = require('path');
const zlib = require('zlib');

class Png8 {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.pngHead = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

        // IHDR块数据
        this.ihdrLen = Buffer.alloc(4);
        this.ihdrLen.writeInt32BE(13, 0);
        this.ihdrBlack = Buffer.from('IHDR');
        this.ihdrData = Buffer.alloc(13);
        this.ihdrData.writeInt32BE(width, 0);
        this.ihdrData.writeInt32BE(height, 4);
        this.ihdrData.writeUInt8(8, 8);
        this.ihdrData.writeUInt8(3, 9); // 3
        this.ihdrData.writeUInt8(0, 10);
        this.ihdrData.writeUInt8(0, 11);
        this.ihdrData.writeUInt8(0, 12);
        this.ihdrCrc = Buffer.alloc(4);
        this.ihdrCrc.writeInt32BE(crc(Buffer.concat([this.ihdrBlack, this.ihdrData])), 0);
        this.ihdr = Buffer.concat([this.ihdrLen, this.ihdrBlack, this.ihdrData, this.ihdrCrc]);

        // PLTE块数据
        this.plte = null;

        // TRNS块数据
        this.trns = null;


        // PHYS块数据
        let physLen = Buffer.alloc(4);
        physLen.writeInt32BE(9, 0);
        let physBlack = Buffer.from('pHYs');
        let physData = Buffer.alloc(9);
        physData.writeInt32BE(2835, 0);
        physData.writeInt32BE(2835, 4);
        physData.writeUInt8(1, 8);
        let physCrc = Buffer.alloc(4);
        physCrc.writeInt32BE(crc(Buffer.concat([physBlack, physData])), 0);
        this.phys = Buffer.concat([physLen, physBlack, physData, physCrc]);

        // IDAT块数据, 初始化长度, 每行一个过滤器, 一个过滤器占用1字节, 每个像素占用1字节, 一共height行, 每行width个像素, 一共width*height个像素, 一共width*height+height个字节
        let idatDataArr = [];
        for (let i = 0; i < height; i++) {
            idatDataArr.push(0x00);
            for (let j = 0; j < width; j++) {
                idatDataArr.push(0x00);
            }
        }

        this.idatData = Buffer.from(idatDataArr);
        this.idat = null;

        // IEND块数据
        let iendLen = Buffer.alloc(4);
        iendLen.writeInt32BE(0, 0);
        let iendBlack = Buffer.from('IEND');
        let iendCrc = Buffer.alloc(4);
        iendCrc.writeInt32BE(crc(iendBlack), 0);
        this.iend = Buffer.concat([iendLen, iendBlack, iendCrc]);

    }

    /**
     * // 设置调色板
     * @param {Array} colorList 调色盘数组, 每位颜色为一个数组, 依次为r, g, b, a [[r,g,b,a],...]
     */
    setPlte(colorList) {
        let trnsLen = Buffer.alloc(4);
        trnsLen.writeInt32BE(colorList.length, 0);
        let trnsBlack = Buffer.from('tRNS');
        let trnsData = Buffer.alloc(colorList.length);
        let trnsCrc = Buffer.alloc(4);

        let plteLen = Buffer.alloc(4);
        plteLen.writeInt32BE(colorList.length * 3, 0);
        let plteBlack = Buffer.from('PLTE');
        let plteData = Buffer.alloc(colorList.length * 3);
        let plteCrc = Buffer.alloc(4);

        for (let i = 0; i < colorList.length; i++) {
            let R = colorList[i][0];
            let G = colorList[i][1];
            let B = colorList[i][2];
            let A = colorList[i][3];

            plteData.writeUInt8(R, i * 3);
            plteData.writeUInt8(G, i * 3 + 1);
            plteData.writeUInt8(B, i * 3 + 2);
            trnsData.writeUInt8(A, i);
        }

        trnsCrc.writeInt32BE(crc(Buffer.concat([trnsBlack, trnsData])), 0);
        this.trns = Buffer.concat([trnsLen, trnsBlack, trnsData, trnsCrc]);

        plteCrc.writeInt32BE(crc(Buffer.concat([plteBlack, plteData])), 0);
        this.plte = Buffer.concat([plteLen, plteBlack, plteData, plteCrc]);
    }

    // 设置物理像素尺寸
    setPhys(phys) { }

    updateIdat() {
        let idatLen = Buffer.alloc(4);
        let idatBlack = Buffer.from('IDAT');
        let idatDataDEF = zlib.deflateSync(this.idatData);
        idatLen.writeInt32BE(idatDataDEF.length, 0);
        let idatCrc = Buffer.alloc(4);
        //TODO: 待测试, 此处应计算压缩后的数据还是压缩前的数据
        idatCrc.writeInt32BE(crc(Buffer.concat([idatBlack, idatDataDEF])), 0); 
        this.idat = Buffer.concat([idatLen, idatBlack, idatDataDEF, idatCrc]);
    }

    // 设置像素点颜色
    setPixel(x, y, colorIdx) {
        // 计算指定像素在idat buffer中的实际位置
        const pos = (this.width * y) + y + 1 + x;
        this.idatData.writeUInt8(colorIdx, pos);
    }

    // 保存png图片
    writeFile(path) {
        return new Promise((resolve, reject) => {
            // console.log(this.pngHead, this.ihdr, this.idat, this.iend);
            // const writeData = Buffer.concat([this.pngHead, this.ihdr, this.idat, this.iend]);
            const writeData = Buffer.concat([this.pngHead, this.ihdr, this.plte, this.trns, this.phys, this.idat, this.iend]);
            fs.writeFileSync(path, writeData);
            resolve(path);
        });

    }
}







const TABLE = [
    0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419,
    0x706af48f, 0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4,
    0xe0d5e91e, 0x97d2d988, 0x09b64c2b, 0x7eb17cbd, 0xe7b82d07,
    0x90bf1d91, 0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
    0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7, 0x136c9856,
    0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
    0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4,
    0xa2677172, 0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
    0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940, 0x32d86ce3,
    0x45df5c75, 0xdcd60dcf, 0xabd13d59, 0x26d930ac, 0x51de003a,
    0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423, 0xcfba9599,
    0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
    0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190,
    0x01db7106, 0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f,
    0x9fbfe4a5, 0xe8b8d433, 0x7807c9a2, 0x0f00f934, 0x9609a88e,
    0xe10e9818, 0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
    0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e, 0x6c0695ed,
    0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
    0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3,
    0xfbd44c65, 0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
    0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a,
    0x346ed9fc, 0xad678846, 0xda60b8d0, 0x44042d73, 0x33031de5,
    0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa, 0xbe0b1010,
    0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
    0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17,
    0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6,
    0x03b6e20c, 0x74b1d29a, 0xead54739, 0x9dd277af, 0x04db2615,
    0x73dc1683, 0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
    0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1, 0xf00f9344,
    0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
    0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a,
    0x67dd4acc, 0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
    0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252, 0xd1bb67f1,
    0xa6bc5767, 0x3fb506dd, 0x48b2364b, 0xd80d2bda, 0xaf0a1b4c,
    0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55, 0x316e8eef,
    0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
    0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe,
    0xb2bd0b28, 0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31,
    0x2cd99e8b, 0x5bdeae1d, 0x9b64c2b0, 0xec63f226, 0x756aa39c,
    0x026d930a, 0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
    0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38, 0x92d28e9b,
    0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
    0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1,
    0x18b74777, 0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
    0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45, 0xa00ae278,
    0xd70dd2ee, 0x4e048354, 0x3903b3c2, 0xa7672661, 0xd06016f7,
    0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc, 0x40df0b66,
    0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
    0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605,
    0xcdd70693, 0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8,
    0x5d681b02, 0x2a6f2b94, 0xb40bbe37, 0xc30c8ea1, 0x5a05df1b,
    0x2d02ef8d
];

function crc(buffer) {
    let crc = -1;
    buffer.forEach(e => {
        crc = TABLE[(crc ^ e) & 0xff] ^ (crc >>> 8);
    });

    return crc ^ -1;
}


module.exports = Png8;


// const png = new Png8(10, 10);
// let paltte = [[255,255,255,255], [242, 52, 86, 255], [20, 111, 139, 0 ], [51, 139, 20, 255]];
// png.setPlte(paltte);

// for(let x=0;x<10;x++){
//     for(let y=0;y<10;y++){
//         if(x%2==0 && y%2==0){
//             png.setPixel(x, y, 1);
//         }else if(x%2==0 && y%2==1){
//             png.setPixel(x, y, 2);
//         }
//     }
// }

// png.updateIdat();

// png.writeFile('./testPng.png').then(res=>{
//     console.log(res);
// });


// let input = 'Aiyawoc';
// let deflateData = zlib.deflateSync(input);
// console.log(deflateData);
// let inflateData = zlib.inflateSync(deflateData);
// console.log(inflateData.toString());


// let testPath = './testPng.png';
// let buf = fs.readFileSync(testPath);
// let idatBuf = buf.slice(0x29, 0x29 + 0x2E);
// console.log(idatBuf.length, idatBuf);
// let inflateData = zlib.inflateSync(idatBuf);
// console.log(inflateData.length, inflateData);
// fs.writeFileSync('./testPng.bin', inflateData);

// 解压后长度为10100, 即为w * h + h,(100*100+100), 



