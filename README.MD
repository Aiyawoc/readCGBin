# CG图档操作工具 Node.js

### 功能:
#### 1. 拆分图档为独立文件 √
#### 2. 合并图档为新文件  √
#### 3. 合并图档到现有文件  √ (目前可处理20位数据头的PUK3数据, 其它版本待研究)
#### 4. 删除现有文件中的指定图档
#### 5. 图档与bmp互转
#### 6. bmp批量合成图档
#### 7. 图形界面(Electron)
#### 8. 待补充

### ISSUE:
#### 1. 不同版本的文件如何合并? 例如初心的图档g文件中, 数据头为16位, 是否能合并到数据头为20位的g文件中?
#### 2. 

### 方法:
#### getAnimeById 通过动画编号拆分数据到独立数据文件
#### addAnimeById 将指定编号的独立数据文件合并到图档, 独立数据文件来源于 getAnimeById 方法
#### 
#### 

### 类:
#### GraphicInfo类 图片信息类, 传入40位图片信息hex实例化
#### Graphic类 图片数据类, 传入图片数据hex实例化
#### AnimeInfo类 动画信息类, 传入12位动画信息hex实例化
#### Anime类 动画数据类, 传入动画数据hex实例化
#### Action类 动作类, 传入动作数据hex实例化, 一般由Anime类实例化时处理
#### Frame类 帧类, 传入帧数据hex实例化, 一般由Anime类实例化时处理