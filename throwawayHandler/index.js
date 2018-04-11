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

    if (event.path.match(/^\/throwaway/)) {
        if (httpMethod === 'GET') {
            return handleItemsGET(event, context);
            
        } else if (httpMethod === 'PUT') {
            return handleItemsPUT(event, context);
            
        }
        
    }
    return errorResponse(context, 'Unhandled http method:', httpMethod);
    
}

function handleItemsGET (event, context) {

    const params = {
        KeyConditionExpression: 'Id = :key',
        ExpressionAttributeValues: { ':key': event.queryStringParameters.Id },
        TableName: itemTable,

    };

    console.log('GET query: ' + JSON.stringify(params));

    doc.query(params, (err, data) => {
        if(err) { return errorResponse(context, 'Error:', err); }
        return successResponse(context, data);

    });

    
}

function handleItemsPUT (event, context){
    const throwaway = JSON.parse(event.body);
    
    var dt = new Date(throwaway.disposalDate);
    var disposalDate = dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
    
    const params = {
        TableName: itemTable,
        Key: { Id: uuidv1()
            
        },

        UpdateExpression: 'set #a = :val1, #b = :val2, #c = :val3, #d = :val4',
        ExpressionAttributeNames: {'#a': 'item', '#b': 'quantity', '#c': 'unitPrice', '#d': 'disposalDate'},
        ExpressionAttributeValues: {':val1': throwaway.item, ':val2': throwaway.quantity, ':val3': throwaway.unitPrice, ':val4': disposalDate},
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
