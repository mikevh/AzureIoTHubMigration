var nitrogen = require('nitrogen')
  , Store = require('nitrogen-file-store');

var config = {
    // this must match with name in azure connection string
    devicename: 'mydevice',
    // use azure or nitrogen
    iotService: 'azure',

    // following three are only nitrogen specific 
    host: 'mynitrogenservice.address.invalid',
    http_port: 8000,
    protocol: 'http',

    // Use this with nitrogen
    api_key: '6852add123456788a10b416d2571462' 
    
    // use this with azure
    api_key: 'azure iot hub connection string from azure portal' 
}

config.store = new Store(config);

config.log_levels = ['info', 'warn', 'error'];
module.exports = config;
