let random = (prefix = '', randomLength = 10) => {
    // 兼容更低版本的默认值写法
    prefix === undefined ? prefix = '' : prefix;
    randomLength === undefined ? randomLength = 8 : randomLength;

    // 设置随机用户名
    // 用户名随机词典数组
    let nameArr = [1, 2, 3, 4, 5,6, 7, 8, 9, 0 ]
    // 随机名字字符串
    let name = prefix;
    // 循环遍历从用户词典中随机抽出一个
    for (let i = 0; i < randomLength; i++) {
        // 随机生成index
        let zm = nameArr[Math.floor(Math.random() * nameArr.length)];
        name += zm;
    }
    // 将随机生成的名字返回
    return name;
};
