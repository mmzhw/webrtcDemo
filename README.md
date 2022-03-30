# webrtcDemo
v1.0.0 
1. 简单的点对点呼叫+屏幕共享， 
2. 目前适合内网，chrome 
3. chrome要屏幕共享需要在属性中添加--enable-usermedia-screen-capturing

v1.1
1. 增加房间管理,最大2人 
2. 引入turn/stun服务器

# coturn
coturn是一个开源的STUN/TURN服务器。  
操作环境：阿里云服务器  
操作系统：Centos7.8.2003（64位）  

1. coturn部署需要使用openssl和openssl-devel
yum -y install openssl  
yum -y install openssl-devel  

2. 使用Git下载安装  
git clone https://github.com/coturn/coturn.git  

3. 下载压缩包安装  
wget https://coturn.net/turnserver/v4.5.1.2/turnserver-4.5.1.2.tar.gz  
tar -zxvf turnserver-4.5.1.2.tar.gz

4. 安装  
cd turnserver-4.5.1.2  
./configure --prefix=/usr/local/turnserver  
make  
make install  
5. 配置  
   cd /usr/local/turnserver/etc/  
   cp turnserver.conf.default turnserver.conf  
   vim turnserver.conf    
   编辑turnserver.conf文件，添加一下内容，其他参数可使用默认配置  
   listening-port=3478 #监听端口，默认3478  
   external-ip=39.96.xxx.xxx #外网IP  
   user=test:123456 #用户名:密码，可配置多个  
   realm=mycompany.org #域名，可选
6. 启动服务
   cd /usr/local/turnserver/  
   ./bin/turnserver -v -r 39.96.xxx.xxx -a -o -c ./etc/turnserver.conf
7. 测试地址
https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/


注意：一定要打开相关端口，配置UDP、TCP。  
