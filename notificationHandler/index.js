'use strict';

const AWS = require('aws-sdk');

const doc = new AWS.DynamoDB.DocumentClient();
const itemTable = process.env.ITEM_TABLE;
const uuidv1 = require('uuid/v1');

exports.handler = function (event, context, callback) {
    console.log('request: ' + JSON.stringify(event));
    handleHttpMethod(event, context);
    
};

function handleHttpMethod (event, context) {
    const httpMethod = event.httpMethod;

    if (event.path.match(/^\/notification/)) {
        if (httpMethod === 'GET') {
            return handleItemsGET(event, context);
            
        } else if (httpMethod === 'PUT') {
            return handleItemsPUT(event, context);
            
        }
        
    }
    return errorResponse(context, 'Unhandled http method:', httpMethod);
    
}

function handleItemsGET (event, context) {
    
    var dt = new Date(event.queryStringParameters.deliveryDate);
    var deliveryDate = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
    
     const params = {
  TableName : itemTable,
  FilterExpression : 'deliveryDate = :key',
  ExpressionAttributeValues : {':key' : deliveryDate}
};
    
    console.log('GET query: ' + JSON.stringify(params));
    
    doc.scan(params, (err, data) => {
        if(err) { return errorResponse(context, 'Error:', err); }
        return successResponse(context, data);
    
        //delete this comment
    });
    
}

function handleItemsPUT (event, context){
    const notification = JSON.parse(event.body);
    
    var dt = new Date(notification.sellByDate);
    var sellByDate = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
    dt.setDate( dt.getDate() - notification.daysPrior);
    var deliveryDate = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
    
    dt.setDate(notification.dateOfCreation);
    var dateOfCreation = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
    
    const params = {
        TableName: itemTable,
        Key: { Id: uuidv1()
            
        },

        UpdateExpression: 'set #a = :val1, #b = :val2, #c = :val3, #d = :val4, #e = :val5, #f = :val6, #g = :val7, #h = :val8, #i = :val9',
        ExpressionAttributeNames: {'#a': 'item', '#b': 'quantity', '#c': 'unitPrice', '#d': 'sellByDate', '#e': 'daysPrior', '#f': 'deliveryOption', '#g': 'dateOfCreation', '#h': 'memo', '#i': 'deliveryDate' },
        ExpressionAttributeValues: {':val1': notification.item.item, ':val2': notification.item.quantity, ':val3': notification.item.unitPrice, ':val4': sellByDate, ':val5': notification.daysPrior, ':val6': notification.deliveryOption, ':val7': dateOfCreation, ':val8': notification.memo, ':val9': deliveryDate},
        //For testing
        ReturnValues: 'ALL_NEW'
        
    };
    
    console.log('Updating notifications:', JSON.stringify(params));
    doc.update(params, (err, data) => {
        if(err) { return errorResponse(context, 'Error: Could not update notifications', err.message) }
        return successResponse(context, {notification: data.Attributes});
        
    });
    
}


function errorResponse(context, logline){
    const response = { statusCode: 404, body: JSON.stringify({ 'Error': 'Could not execute request' }) };
    const args = Array.from(arguments).slice(1);
    
    console.log.apply(null, args);
    
    context.succeed(response);

    
}

function successResponse(context, body) {
    const response = { statusCode: 200, body: JSON.stringify(body), headers: { 'Access-Control-Allow-Origin': '*'  } };
    
    console.log('response: ' + JSON.stringify(response));
    
    context.succeed(response);

    
}

