var config = {
    host: 'http://localhost:3000',
    iotService: 'azure',
    
    // these are needed only if iotService: 'nitrogen' is set    
    nitrogen: {
        host: 'mynitrogen-dns-address',
        http_port: 8000,
        protocol: 'http',
        api_key: 'nitrogen api key'
    },
    
    // following lines are needed only if azure iotService is used. Get from Azure portal. http://appelfish.cloudapp.net will help.
    serviceBusHost: '',
    eventHubName: '',
    partitions: 2,
    SASKeyName: 'iothubowner',
    SASKey: '',
    
    // for authentication    
    secret: 'mysecrethash',
    database: 'mongodb://localhost:27017/users'
};

config.connectionString = 'my azure connection string from azure portal';

module.exports = config;
